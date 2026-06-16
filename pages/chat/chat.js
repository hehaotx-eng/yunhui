var api = require('../../utils/api');

Page({
  data: {
    statusBarHeight: 0,
    conversationId: '',
    messages: [],
    inputValue: '',
    myUserId: ''
  },

  onLoad: function(options) {
    var sys = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: sys.statusBarHeight || 20 });
    this.setData({ conversationId: options.conversationId || options.id || '' });
    var userInfo = wx.getStorageSync('userInfo');
    this.setData({ myUserId: userInfo ? String(userInfo.id) : '' });
    this.loadMessages();
    this.startPolling();
  },

  onHide: function() {
    this.stopPolling();
  },

  onUnload: function() {
    this.stopPolling();
  },

  startPolling: function() {
    var that = this;
    that._timer = setInterval(function() {
      that.loadMessages();
    }, 3000);
  },

  stopPolling: function() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  },

  loadMessages: function() {
    var that = this;
    if (!that.data.conversationId) return;
    api.chat.getMessages(that.data.conversationId).then(function(result) {
      var list = Array.isArray(result) ? result : (result.list || result || []);
      that.setData({ messages: list });
      that.scrollToBottom();
    }).catch(function(error) {
      console.error('加载消息失败:', error);
    });
  },

  scrollToBottom: function() {
    setTimeout(function() {
      wx.createSelectorQuery().select('#bottom').boundingClientRect(function() {}).exec();
    }, 200);
  },

  onInput: function(e) {
    this.setData({ inputValue: e.detail.value });
  },

  sendMessage: function() {
    var that = this;
    var content = that.data.inputValue.trim();
    if (!content) return;
    api.chat.sendMessage(that.data.conversationId, content).then(function() {
      that.setData({ inputValue: '' });
      that.loadMessages();
    }).catch(function(error) {
      wx.showToast({ title: error.message || '发送失败', icon: 'none' });
    });
  },

  isMyMessage: function(item) {
    return String(item.sender_id) === this.data.myUserId;
  },

  goBack: function() {
    wx.navigateBack();
  }
});
