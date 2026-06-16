var api = require('../../utils/api');

Page({
  data: {
    statusBarHeight: 0,
    conversations: [],
    loading: true,
    showEmpty: false
  },

  onLoad: function() {
    var sys = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: sys.statusBarHeight || 20 });
  },

  onShow: function() {
    this.loadConversations();
  },

  loadConversations: function() {
    var that = this;
    var token = wx.getStorageSync('token');
    if (!token) {
      that.setData({ conversations: [], loading: false, showEmpty: true });
      return;
    }
    that.setData({ loading: true });
    api.chat.getConversations().then(function(list) {
      var arr = Array.isArray(list) ? list : [];
      that.setData({ conversations: arr, loading: false, showEmpty: arr.length === 0 });
    }).catch(function(e) {
      console.error('加载会话失败:', e);
      that.setData({ conversations: [], loading: false, showEmpty: true });
    });
  },

  goChat: function(e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/chat/chat?conversationId=' + id });
  }
});
