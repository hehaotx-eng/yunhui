var api = require('../../utils/api');

Page({
  data: {
    statusBarHeight: 0,
    userInfo: {},
    stats: { jobs: 0, applications: 0 }
  },

  onLoad: function() {
    var sys = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: sys.statusBarHeight || 20 });
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
  },

  goJobs: function() {
    wx.switchTab({ url: '/pages/enterprise-jobs/enterprise-jobs' });
  },

  goApplications: function() {
    wx.navigateTo({ url: '/pages/enterprise-applications/enterprise-applications' });
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
