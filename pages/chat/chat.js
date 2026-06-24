const api = require('../../utils/api');
const resolve = require('../../utils/image').resolve;
const messageCenter = require('../../services/socket/messageCenter');
const socket = require('../../services/socket/socket');

const QUICK_PHRASES = [
  '您好，我对该岗位很感兴趣',
  '请问接受应届生吗？',
  '请问工作地点在哪里？',
  '薪资范围是多少？',
  '方便电话沟通吗？',
  '可以发一份详细的岗位介绍吗？',
  '请问公司有五险一金吗？',
  '多久能收到面试通知？'
];

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
    statusBarHeight: 0,
    companyId: '',
    isEntryAutoReplyEnabled: true,
    showQuickPhrasesModal: false,
    quickPhrases: QUICK_PHRASES
  },

  _myUserId: '',
  _messageIds: {},
  _bindNewMessage: null,
  _isSubscribed: false,
  _resumeReadStatus: {},

  onLoad(options) {
    const userInfo = wx.getStorageSync('userInfo') || {};
    this._myUserId = String(userInfo.id || '');
    this._messageIds = {};
    this._resumeReadStatus = {};

    let statusBarHeight = 20;
    try {
      const sysInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      statusBarHeight = sysInfo.statusBarHeight || 20;
    } catch (e) {
      statusBarHeight = 20;
    }
    
    const myAvatar = userInfo.avatar ? resolve(userInfo.avatar) : '';
    this.setData({
      conversationId: String(options.conversationId || options.id || ''),
      myAvatar: myAvatar,
      targetName: options.targetName ? decodeURIComponent(options.targetName) : '',
      targetAvatar: options.targetAvatar ? resolve(decodeURIComponent(options.targetAvatar)) : '',
      statusBarHeight: statusBarHeight,
      companyId: String(options.companyId || '')
    });

    this._bindNewMessage = this._onNewMessage.bind(this);

    this._loadConversationDetail();
    this._loadMessages();
    this._subscribe();
    this._markRead();
  },

  onShow() {
    this._subscribe();
    this._checkEntryAutoReply();
    this._refreshResumeStatus();
  },

  onHide() {
    this._unsubscribe();
  },

  onUnload() {
    this._unsubscribe();
  },

  _checkEntryAutoReply() {
    const companyId = this.data.companyId;
    if (!companyId) return;
    if (!this.data.isEntryAutoReplyEnabled) return;

    const greetedKey = `greeted_${companyId}`;
    if (wx.getStorageSync(greetedKey)) return;

    setTimeout(() => {
      this._sendWelcomeMessage();
      wx.setStorageSync(greetedKey, true);
    }, 800);
  },

  _sendWelcomeMessage() {
    const welcomeContent = '您好，欢迎来到XX公司！请问您对哪个岗位感兴趣呢？';
    const tempId = 'temp_welcome_' + Date.now();

    const msg = {
      id: tempId,
      type: 'text',
      content: welcomeContent,
      created_at: new Date().toISOString(),
      isSelf: false,
      avatar: this.data.targetAvatar,
      avatarChar: (this.data.targetName || '聘').charAt(0),
      status: 'success'
    };

    this._messageIds[tempId] = true;
    this.setData({ messages: this.data.messages.concat(msg) });
    this._scrollBottom();

    api.chat.sendMessage(this.data.conversationId, welcomeContent)
      .then(res => {
        const serverId = res && (res.id || res.message_id) ? String(res.id || res.message_id) : null;
        this._updateStatus(tempId, 'success', serverId);
      })
      .catch(() => {
        this._updateStatus(tempId, 'failed');
      });
  },

  _loadConversationDetail() {
    const id = this.data.conversationId;
    if (!id) return;
    if (this.data.targetName) return;

    api.chat.getConversationDetail(id)
      .then(res => {
        if (!res) return;
        const avatar = res.company_logo || res.target_user_avatar || '';
        const name = res.company_name || res.other_user_name || res.nickname || '招聘者';
        this.setData({
          targetName: name,
          targetAvatar: avatar ? resolve(avatar) : '',
          companyId: String(res.company_id || res.target_company_id || '')
        });
      })
      .catch(() => {});
  },

  _loadMessages() {
    const id = this.data.conversationId;

    if (!id) {
      this.setData({ loading: false, messages: [] });
      return;
    }

    this.setData({ loading: true });

    api.chat.getMessages(id)
      .then(res => {
        const list = Array.isArray(res) ? res : (res && res.list ? res.list : []);
        this._render(list);
      })
      .catch(() => {
        wx.showToast({ title: '加载失败', icon: 'none' });
        this.setData({ messages: [] });
      })
      .finally(() => {
        this.setData({ loading: false });
      });
  },

  _refreshResumeStatus() {
    const resumeStatus = wx.getStorageSync('resumeReadStatus') || {};
    this._resumeReadStatus = resumeStatus;
    
    const updatedMessages = this.data.messages.map(msg => {
      if (msg.type === 'resume_card' && this._resumeReadStatus[msg.id]) {
        return { ...msg, resumeStatus: 'read' };
      }
      return msg;
    });
    
    this.setData({ messages: updatedMessages });
  },

  _render(list) {
    const msgs = [];
    const seen = {};
    const myId = this._myUserId;
    const resumeStatus = this._resumeReadStatus;

    for (let i = 0; i < list.length; i++) {
      const m = list[i];
      if (!m.id || seen[m.id]) continue;
      seen[String(m.id)] = true;

      const isSelf = String(m.sender_id) === myId;
      const avatar = m.sender_avatar ? resolve(m.sender_avatar) : '';

      if (m.message_type === 'job') {
        let jobData = {};
        try { jobData = JSON.parse(m.content || '{}'); } catch (e) {}
        msgs.push({
          id: String(m.id),
          type: 'job_card',
          jobId: jobData.id || '',
          jobTitle: jobData.title || '职位',
          jobCompany: jobData.company || '',
          jobSalary: jobData.salary || '',
          jobLocation: jobData.location || '',
          jobTags: jobData.tags || [],
          created_at: m.created_at,
          isSelf: isSelf,
          avatar: isSelf ? this.data.myAvatar : (avatar || this.data.targetAvatar),
          avatarChar: isSelf ? '我' : ((this.data.targetName || '聘').charAt(0)),
          status: 'success',
          isApplied: false
        });
        continue;
      }

      if (m.message_type === 'resume') {
        let resumeData = {};
        try { resumeData = JSON.parse(m.content || '{}'); } catch (e) {}
        const msgId = String(m.id);
        msgs.push({
          id: msgId,
          type: 'resume_card',
          resumeId: resumeData.id || '',
          resumeName: resumeData.name || '',
          resumeIntention: resumeData.intention || '',
          resumeExperience: resumeData.experience || '',
          resumeEducation: resumeData.education || '',
          resumeStatus: resumeStatus[msgId] || 'unread',
          created_at: m.created_at,
          isSelf: isSelf,
          avatar: isSelf ? this.data.myAvatar : (avatar || this.data.targetAvatar),
          avatarChar: isSelf ? '我' : ((this.data.targetName || '聘').charAt(0)),
          status: 'success'
        });
        continue;
      }

      if (m.message_type === 'location') {
        let locationData = {};
        try { locationData = JSON.parse(m.content || '{}'); } catch (e) {}
        msgs.push({
          id: String(m.id),
          type: 'location',
          locationName: locationData.name || '',
          locationAddress: locationData.address || '',
          latitude: locationData.latitude || 0,
          longitude: locationData.longitude || 0,
          created_at: m.created_at,
          isSelf: isSelf,
          avatar: isSelf ? this.data.myAvatar : (avatar || this.data.targetAvatar),
          avatarChar: isSelf ? '我' : ((this.data.targetName || '聘').charAt(0)),
          status: 'success'
        });
        continue;
      }

      msgs.push({
        id: String(m.id),
        type: 'text',
        content: m.content || '',
        created_at: m.created_at,
        isSelf: isSelf,
        avatar: isSelf ? this.data.myAvatar : (avatar || this.data.targetAvatar),
        avatarChar: isSelf ? '我' : ((this.data.targetName || '聘').charAt(0)),
        status: 'success'
      });
    }

    this._messageIds = seen;
    this.setData({ messages: msgs });
    this._scrollBottom();
  },

  _onNewMessage(data) {
    if (!data) return;
    if (String(data.conversation_id) !== String(this.data.conversationId)) return;

    const id = data.id ? String(data.id) : ('ws_' + Date.now());

    if (this._messageIds[id]) return;
    this._messageIds[id] = true;

    const isSelf = String(data.sender_id) === this._myUserId;
    const avatar = data.sender_avatar ? resolve(data.sender_avatar) : '';

    let msg;
    if (data.message_type === 'job') {
      let jobData = {};
      try { jobData = JSON.parse(data.content || '{}'); } catch (e) {}
      msg = {
        id: id,
        type: 'job_card',
        jobId: jobData.id || '',
        jobTitle: jobData.title || '职位',
        jobCompany: jobData.company || '',
        jobSalary: jobData.salary || '',
        jobLocation: jobData.location || '',
        jobTags: jobData.tags || [],
        created_at: data.created_at || new Date().toISOString(),
        isSelf: isSelf,
        avatar: isSelf ? this.data.myAvatar : (avatar || this.data.targetAvatar),
        avatarChar: isSelf ? '我' : ((this.data.targetName || '聘').charAt(0)),
        status: 'success',
        isApplied: false
      };
    } else if (data.message_type === 'resume') {
      let resumeData = {};
      try { resumeData = JSON.parse(data.content || '{}'); } catch (e) {}
      msg = {
        id: id,
        type: 'resume_card',
        resumeId: resumeData.id || '',
        resumeName: resumeData.name || '',
        resumeIntention: resumeData.intention || '',
        resumeExperience: resumeData.experience || '',
        resumeEducation: resumeData.education || '',
        resumeStatus: this._resumeReadStatus[id] || 'unread',
        created_at: data.created_at || new Date().toISOString(),
        isSelf: isSelf,
        avatar: isSelf ? this.data.myAvatar : (avatar || this.data.targetAvatar),
        avatarChar: isSelf ? '我' : ((this.data.targetName || '聘').charAt(0)),
        status: 'success'
      };
    } else if (data.message_type === 'location') {
      let locationData = {};
      try { locationData = JSON.parse(data.content || '{}'); } catch (e) {}
      msg = {
        id: id,
        type: 'location',
        locationName: locationData.name || '',
        locationAddress: locationData.address || '',
        latitude: locationData.latitude || 0,
        longitude: locationData.longitude || 0,
        created_at: data.created_at || new Date().toISOString(),
        isSelf: isSelf,
        avatar: isSelf ? this.data.myAvatar : (avatar || this.data.targetAvatar),
        avatarChar: isSelf ? '我' : ((this.data.targetName || '聘').charAt(0)),
        status: 'success'
      };
    } else {
      msg = {
        id: id,
        type: 'text',
        content: data.content || '',
        created_at: data.created_at || new Date().toISOString(),
        isSelf: isSelf,
        avatar: isSelf ? this.data.myAvatar : (avatar || this.data.targetAvatar),
        avatarChar: isSelf ? '我' : ((this.data.targetName || '聘').charAt(0)),
        status: 'success'
      };
    }

    this.setData({ messages: this.data.messages.concat(msg) });
    this._scrollBottom();
  },

  sendMessage() {
    const text = this.data.inputValue.trim();
    if (!text) return;

    const tempId = 'temp_' + Date.now();

    const msg = {
      id: tempId,
      type: 'text',
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
      .catch(() => {
        this._updateStatus(tempId, 'failed');
      });
  },

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

  _updateResumeStatus(messageId) {
    const resumeStatus = { ...this._resumeReadStatus, [messageId]: 'read' };
    this._resumeReadStatus = resumeStatus;
    wx.setStorageSync('resumeReadStatus', resumeStatus);

    const updatedMessages = this.data.messages.map(msg => {
      if (msg.id === messageId && msg.type === 'resume_card') {
        return { ...msg, resumeStatus: 'read' };
      }
      return msg;
    });

    this.setData({ messages: updatedMessages });
  },

  onInput(e) {
    this.setData({ inputValue: e.detail.value });
  },

  _scrollBottom() {
    setTimeout(() => {
      this.setData({ toView: 'bottom-anchor' });
    }, 100);
  },

  _markRead() {
    const id = this.data.conversationId;
    if (!id) return;
    api.chat.markRead(id).catch(() => {});
  },

  goBack() {
    wx.navigateBack();
  },

  goJobDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (id) wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
  },

  openLocation(e) {
    const latitude = e.currentTarget.dataset.latitude;
    const longitude = e.currentTarget.dataset.longitude;
    const name = e.currentTarget.dataset.name || '位置';
    
    if (!latitude || !longitude) return;
    
    wx.openLocation({
      latitude: Number(latitude),
      longitude: Number(longitude),
      name: name,
      success: () => {},
      fail: () => {
        wx.showToast({ title: '打开地图失败', icon: 'none' });
      }
    });
  },

  onViewResume(e) {
    const messageId = e.currentTarget.dataset.messageId;
    if (messageId) {
      this._updateResumeStatus(messageId);
    }
    const resumeId = e.currentTarget.dataset.resumeId;
    if (resumeId) {
      wx.navigateTo({ url: '/pages/resume-preview/resume-preview?id=' + resumeId });
    }
  },

  onJobApply(e) {
    const jobId = e.currentTarget.dataset.jobId;
    const messageId = e.currentTarget.dataset.messageId;
    if (!jobId || !messageId) return;

    const updatedMessages = this.data.messages.map(msg => {
      if (msg.id === messageId && msg.type === 'job_card') {
        return { ...msg, isApplied: true };
      }
      return msg;
    });

    this.setData({ messages: updatedMessages });
  },

  showQuickPhrases() {
    this.setData({ 
      showQuickPhrasesModal: true,
      quickPhrases: QUICK_PHRASES
    });
  },

  onQuickPhraseSelect(e) {
    const phrase = e.currentTarget.dataset.phrase;
    this.setData({
      inputValue: phrase,
      showQuickPhrasesModal: false
    });
  },

  closeQuickPhrasesModal() {
    this.setData({ showQuickPhrasesModal: false });
  },

  onModalTouchMove() {
  },

  sendLocation() {
    wx.authorize({
      scope: 'scope.userLocation',
      success: () => {
        wx.chooseLocation({
          success: (res) => {
            const tempId = 'temp_location_' + Date.now();
            const locationData = {
              name: res.name || '',
              address: res.address || '',
              latitude: res.latitude,
              longitude: res.longitude
            };

            const msg = {
              id: tempId,
              type: 'location',
              locationName: locationData.name,
              locationAddress: locationData.address,
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              created_at: new Date().toISOString(),
              isSelf: true,
              avatar: this.data.myAvatar,
              avatarChar: '我',
              status: 'sending'
            };

            this._messageIds[tempId] = true;
            this.setData({ messages: this.data.messages.concat(msg) });
            this._scrollBottom();

            api.chat.sendMessage(this.data.conversationId, JSON.stringify(locationData), 'location')
              .then(res => {
                const serverId = res && (res.id || res.message_id) ? String(res.id || res.message_id) : null;
                this._updateStatus(tempId, 'success', serverId);
              })
              .catch(() => {
                this._updateStatus(tempId, 'failed');
              });
          },
          fail: () => {
            wx.showToast({ title: '选择位置失败', icon: 'none' });
          }
        });
      },
      fail: () => {
        wx.showToast({ title: '请授权位置权限', icon: 'none' });
      }
    });
  },

  sendResume() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    const userId = userInfo.id;
    
    if (!userId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    api.resumes.getMy()
      .then(res => {
        if (!res) {
          wx.showToast({ title: '请先创建简历', icon: 'none' });
          return;
        }

        const resumeData = {
          id: res.id,
          name: res.name || userInfo.nickname || '',
          intention: res.intention || '',
          experience: res.experience || '',
          education: res.education || ''
        };

        const tempId = 'temp_resume_' + Date.now();

        const msg = {
          id: tempId,
          type: 'resume_card',
          resumeId: resumeData.id,
          resumeName: resumeData.name,
          resumeIntention: resumeData.intention,
          resumeExperience: resumeData.experience,
          resumeEducation: resumeData.education,
          resumeStatus: 'unread',
          created_at: new Date().toISOString(),
          isSelf: true,
          avatar: this.data.myAvatar,
          avatarChar: '我',
          status: 'sending'
        };

        this._messageIds[tempId] = true;
        this.setData({ messages: this.data.messages.concat(msg) });
        this._scrollBottom();

        api.chat.sendMessage(this.data.conversationId, JSON.stringify(resumeData), 'resume')
          .then(res => {
            const serverId = res && (res.id || res.message_id) ? String(res.id || res.message_id) : null;
            this._updateStatus(tempId, 'success', serverId);
          })
          .catch(() => {
            this._updateStatus(tempId, 'failed');
          });
      })
      .catch(() => {
        wx.showToast({ title: '获取简历失败', icon: 'none' });
      });
  },

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
  },

  onShareAppMessage() {
    var name = this.data.targetName || '';
    return { title: name ? '与 ' + name + ' 的对话' : '聊天', path: '/pages/chat/chat?conversationId=' + this.data.conversationId };
  },

  onShareTimeline() {
    return null;
  }
});