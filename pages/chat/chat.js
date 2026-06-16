const { chat } = require('../../utils/api.js');

Page({
  data: {
    conversationId: '',
    messages: [],
    inputValue: '',
    myUserId: ''
  },

  onLoad(options) {
    this.setData({ conversationId: options.conversationId || options.id || '' });
    const userInfo = wx.getStorageSync('userInfo');
    this.setData({ myUserId: userInfo ? String(userInfo.id) : '' });
    this.loadMessages();
  },

  async loadMessages() {
    if (!this.data.conversationId) return;
    try {
      const result = await chat.getMessages(this.data.conversationId);
      const list = Array.isArray(result) ? result : (result.list || result || []);
      this.setData({ messages: list });
      this.scrollToBottom();
    } catch (error) {
      console.error('加载消息失败:', error);
    }
  },

  scrollToBottom() {
    setTimeout(() => {
      const query = wx.createSelectorQuery();
      query.select('#bottom').boundingClientRect();
      query.exec(() => {});
    }, 100);
  },

  onInput(e) {
    this.setData({ inputValue: e.detail.value });
  },

  async sendMessage() {
    const content = this.data.inputValue.trim();
    if (!content) return;

    try {
      await chat.sendMessage(this.data.conversationId, content);
      this.setData({ inputValue: '' });
      this.loadMessages();
    } catch (error) {
      wx.showToast({ title: error.message || '发送失败', icon: 'none' });
    }
  },

  isMyMessage(item) {
    return String(item.sender_id) === this.data.myUserId;
  }
});
