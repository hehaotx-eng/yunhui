const { conversations } = require('../../utils/api.js');

Page({
  data: {
    conversations: [],
    loading: true
  },

  onLoad: function () {
    this.loadConversations();
  },

  onShow: function () {
    this.loadConversations();
  },

  loadConversations: async function () {
    var token = wx.getStorageSync('token');
    if (!token) {
      this.setData({ loading: false });
      return;
    }
    try {
      var data = await conversations.getList();
      var list = data || [];
      for (var i = 0; i < list.length; i++) {
        list[i].timeText = this.formatTime(list[i].last_message_at);
      }
      this.setData({ conversations: list, loading: false });
    } catch (error) {
      console.error('加载会话失败:', error);
      this.setData({ loading: false });
    }
  },

  formatTime: function (dateStr) {
    if (!dateStr) return '';
    var date = new Date(dateStr);
    var now = new Date();
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var h = hours < 10 ? '0' + hours : '' + hours;
    var m = minutes < 10 ? '0' + minutes : '' + minutes;
    var time = h + ':' + m;

    var isToday = date.getFullYear() === now.getFullYear() &&
                  date.getMonth() === now.getMonth() &&
                  date.getDate() === now.getDate();
    if (isToday) return time;

    var yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    var isYesterday = date.getFullYear() === yesterday.getFullYear() &&
                      date.getMonth() === yesterday.getMonth() &&
                      date.getDate() === yesterday.getDate();
    if (isYesterday) return '昨天';

    return (date.getMonth() + 1) + '/' + date.getDate();
  },

  goChat: function (e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/chat/chat?id=' + id });
  }
});
