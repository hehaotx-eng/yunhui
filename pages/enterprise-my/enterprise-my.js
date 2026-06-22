var api = require('../../utils/api');

Page({
  data: {
    userInfo: {},
    stats: { jobs: 0, applications: 0, favorites: 0 },
    favorites: []
  },

  onLoad: function() {
    this.loadData();
  },

  onShow: function() {
    this.loadData();
  },

  loadData: function() {
    var that = this;
    var userInfo = wx.getStorageSync('userInfo') || {};
    that.setData({ userInfo: userInfo });

    api.jobs.getMyList().then(function(result) {
      var list = Array.isArray(result) ? result : (result.list || result.rows || []);
      that.setData({ 'stats.jobs': list.length });
    }).catch(function() {});

    api.request({ url: '/api/v1/enterprise/favorites' }).then(function(data) {
      var list = data.list || [];
      that.setData({ 'stats.favorites': list.length, favorites: list });
    }).catch(function() {});
  },

  goJobs: function() {
    wx.switchTab({ url: '/pages/enterprise-jobs/enterprise-jobs' });
  },

  goApplications: function() {
    wx.navigateTo({ url: '/pages/enterprise-applications/enterprise-applications' });
  },

  goFavorites: function() {
    wx.navigateTo({ url: '/pages/enterprise-favorites/enterprise-favorites' });
  },

  handleLogout: function() {
    var that = this;
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: function(res) {
        if (res.confirm) {
          var app = getApp();
          app.clearUserState();
          app.updateTabBar('user');
          wx.reLaunch({ url: '/pages/home/home' });
        }
      }
    });
  }
});
