const api = require('../../utils/api');
const resolve = require('../../utils/image').resolve;
const messageCenter = require('../../services/socket/messageCenter');
const socket = require('../../services/socket/socket');

Page({
  data: {
    conversationId: '',
    messages: [],
    inputValue: '',
    loading: true,
    toView: '',
    targetName: '',
    targetAvatar: '',
    myAvatar: '',
    statusBarHeight: 0
  },

  _myUserId: '',
  _messageIds: {},
  _bindNewMessage: null,
  _isSubscribed: false,

  onLoad(options) {
    const userInfo = wx.getStorageSync('userInfo') || {};
    this._myUserId = String(userInfo.id || '');
    this._messageIds = {};

    const sysInfo = wx.getSystemInfoSync();
    const myAvatar = userInfo.avatar ? resolve(userInfo.avatar) : '';
    this.setData({
      conversationId: String(options.conversationId || options.id || ''),
      myAvatar: myAvatar,
      targetName: options.targetName ? decodeURIComponent(options.targetName) : '',
      targetAvatar: options.targetAvatar ? resolve(decodeURIComponent(options.targetAvatar)) : '',
      statusBarHeight: sysInfo.statusBarHeight || 20
    });

    this._bindNewMessage = this._onNewMessage.bind(this);

    this._loadConversationDetail();
    this._loadMessages();
    this._subscribe();
    this._markRead();
  },

  onShow() {
    this._subscribe();
  },

  onHide() {
    this._unsubscribe();
  },

  onUnload() {
    this._unsubscribe();
  },

  /* ========== 加载会话详情 ========== */
  _loadConversationDetail() {
    const id = this.data.conversationId;
    if (!id) return;
    if (this.data.targetName) return;

    api.chat.getConversationDetail(id)
      .then(res => {
        if (!res) return;
        const avatar = res.company_logo || res.target_user_avatar || '';
        const name = res.company_name || res.other_user_name || '联系人';
        this.setData({
          targetName: name,
          targetAvatar: avatar ? resolve(avatar) : ''
        });
      })
      .catch(() => {});
  },

  /* ========== 消息加载 ========== */
  _loadMessages() {
    const id = this.data.conversationId;

    if (!id) {
      console.error('conversationId 为空');
      this.setData({ loading: false, messages: [] });
      return;
    }

    this.setData({ loading: true });

    api.chat.getMessages(id)
      .then(res => {
        const list = Array.isArray(res) ? res : (res && res.list ? res.list : []);
        this._render(list);
      })
      .catch(err => {
        console.error('加载消息失败:', err);
        wx.showToast({ title: '加载失败', icon: 'none' });
        this.setData({ messages: [] });
      })
      .finally(() => {
        this.setData({ loading: false });
      });
  },

  /* ========== 渲染消息 ========== */
  _render(list) {
    const msgs = [];
    const seen = {};
    const myId = this._myUserId;

    for (let i = 0; i < list.length; i++) {
      const m = list[i];
      if (!m.id || seen[m.id]) continue;
      seen[String(m.id)] = true;

      if (m.message_type === 'job') continue;

      const isSelf = String(m.sender_id) === myId;
      const avatar = m.sender_avatar ? resolve(m.sender_avatar) : '';

      msgs.push({
        id: String(m.id),
        content: m.content || '',
        created_at: m.created_at,
        isSelf: isSelf,
        avatar: isSelf ? this.data.myAvatar : (avatar || this.data.targetAvatar),
        avatarChar: isSelf ? '我' : ((this.data.targetName || '对').charAt(0)),
        status: 'success'
      });
    }

    this._messageIds = seen;
    this.setData({ messages: msgs });
    this._scrollBottom();
  },

  /* ========== WebSocket 新消息 ========== */
  _onNewMessage(data) {
    if (!data) return;
    if (String(data.conversation_id) !== String(this.data.conversationId)) return;

    const id = data.id ? String(data.id) : ('ws_' + Date.now());

    if (this._messageIds[id]) return;
    this._messageIds[id] = true;

    const isSelf = String(data.sender_id) === this._myUserId;
    const avatar = data.sender_avatar ? resolve(data.sender_avatar) : '';

    const msg = {
      id: id,
      content: data.content || '',
      created_at: data.created_at || new Date().toISOString(),
      isSelf: isSelf,
      avatar: isSelf ? this.data.myAvatar : (avatar || this.data.targetAvatar),
      avatarChar: isSelf ? '我' : ((this.data.targetName || '对').charAt(0)),
      status: 'success'
    };

    this.setData({ messages: this.data.messages.concat(msg) });
    this._scrollBottom();
  },

  /* ========== 发送消息 ========== */
  sendMessage() {
    const text = this.data.inputValue.trim();
    if (!text) return;

    const tempId = 'temp_' + Date.now();

    const msg = {
      id: tempId,
      content: text,
      created_at: new Date().toISOString(),
      isSelf: true,
      avatar: this.data.myAvatar,
      avatarChar: '我',
      status: 'sending'
    };

    this._messageIds[tempId] = true;

    this.setData({
      messages: this.data.messages.concat(msg),
      inputValue: ''
    });

    this._scrollBottom();

    api.chat.sendMessage(this.data.conversationId, text)
      .then(res => {
        const serverId = res && (res.id || res.message_id) ? String(res.id || res.message_id) : null;
        this._updateStatus(tempId, 'success', serverId);
      })
      .catch(err => {
        console.error('发送失败:', err);
        this._updateStatus(tempId, 'failed');
      });
  },

  /* ========== 更新状态 ========== */
  _updateStatus(id, status, newId) {
    const msgs = this.data.messages;
    const updated = [];
    let found = false;

    for (let i = 0; i < msgs.length; i++) {
      if (!found && msgs[i].id === id) {
        found = true;
        const item = Object.assign({}, msgs[i], { status: status });
        if (newId) {
          delete this._messageIds[id];
          item.id = newId;
          this._messageIds[newId] = true;
        }
        updated.push(item);
      } else {
        updated.push(msgs[i]);
      }
    }

    this.setData({ messages: updated });
  },

  /* ========== 输入 ========== */
  onInput(e) {
    this.setData({ inputValue: e.detail.value });
  },

  /* ========== 滚动到底部 ========== */
  _scrollBottom() {
    setTimeout(() => {
      this.setData({ toView: 'bottom-anchor' });
    }, 100);
  },

  /* ========== 已读 ========== */
  _markRead() {
    const id = this.data.conversationId;
    if (!id) return;
    api.chat.markRead(id).catch(() => {});
  },

  /* ========== 返回 ========== */
  goBack() {
    wx.navigateBack();
  },

  /* ========== socket ========== */
  _subscribe() {
    if (this._isSubscribed) return;
    if (!this._bindNewMessage) return;
    messageCenter.on('NEW_MESSAGE', this._bindNewMessage);
    this._isSubscribed = true;
  },

  _unsubscribe() {
    if (!this._isSubscribed) return;
    if (!this._bindNewMessage) return;
    messageCenter.off('NEW_MESSAGE', this._bindNewMessage);
    this._isSubscribed = false;
  }
});
