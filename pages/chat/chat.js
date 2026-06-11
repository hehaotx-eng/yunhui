const { messages } = require('../../utils/api.js');

Page({
  data: {
    id: '',
    messages: [],
    inputValue: '',
    myUserId: ''
  },

  onLoad(options) {
    this.setData({ id: options.id });
    const userInfo = wx.getStorageSync('userInfo');
    this.setData({ myUserId: userInfo?.id || '' });
    this.loadMessages();
  },

  async loadMessages() {
    if (!this.data.id) return;
    try {
      const result = await messages.getConversation({ conversationId: this.data.id });
      const list = Array.isArray(result) ? result : (result.data || result.list || result.messages || []);
      this.setData({ messages: list });
      setTimeout(() => {
        const query = wx.createSelectorQuery();
        query.select('#bottom').boundingClientRect();
        query.exec(() => {});
      }, 100);
    } catch (error) {
      console.error('加载消息失败:', error);
    }
  },

  onInput(e) {
    this.setData({ inputValue: e.detail.value });
  },

  async sendMessage() {
    const content = this.data.inputValue.trim();
    if (!content) return;
    try {
      await messages.send({
        conversationId: this.data.id,
        content
      });
      this.setData({ inputValue: '' });
      this.loadMessages();
    } catch (error) {
      wx.showToast({ title: error.message || '发送失败', icon: 'none' });
    }
  },

  getAvatarLetter(item) {
    const name = item.enterpriseName || item.username || item.name || '聊';
    return name.substring(0, 1);
  }
});