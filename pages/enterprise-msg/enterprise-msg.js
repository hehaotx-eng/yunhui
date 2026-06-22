var api = require('../../utils/api');
var resolve = require('../../utils/image').resolve;

Page({
  data: {
    conversations: [],
    loading: true,
    showEmpty: false
  },

  onLoad: function() {
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
      var processed = arr.map(function(conv) {
        var avatar = conv.target_user_avatar || conv.avatar_url || conv.avatar || '';
        if (avatar) avatar = resolve(avatar);
        return Object.assign({}, conv, { target_user_avatar: avatar });
      });
      that.setData({ conversations: processed, loading: false, showEmpty: processed.length === 0 });
      var totalUnread = 0;
      arr.forEach(function(c) { totalUnread += (c.unread_count || 0); });
      var tabBar = that.selectComponent('#tabbar');
      if (tabBar && tabBar.setBadge) {
        tabBar.setBadge('msg', totalUnread);
      }
    }).catch(function(e) {
      console.error('加载会话失败:', e);
      that.setData({ conversations: [], loading: false, showEmpty: true });
    });
  },

  goChat: function(e) {
    var id = e.currentTarget.dataset.id;
    var name = e.currentTarget.dataset.name || '';
    var avatar = e.currentTarget.dataset.avatar || '';
    wx.navigateTo({ url: '/pages/chat/chat?conversationId=' + id + '&targetName=' + encodeURIComponent(name) + '&targetAvatar=' + encodeURIComponent(avatar) });
  }
});
