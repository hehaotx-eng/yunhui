var api = require('../../utils/api');
var { resolve } = require('../../utils/image');
var cached = require('../../utils/cached-request');

Page({
  data: {
    userInfo: {},
    companyInfo: {},
    stats: { jobs: 0, applications: 0, favorites: 0 }
  },

  onLoad: function() {
    this.loadData();
  },

  onShow: function() {
    this.loadData();
  },

  loadData: function() {
    var that = this;

    // 用户信息：本地读取
    var userInfo = wx.getStorageSync('userInfo') || {};
    if (userInfo.avatar) userInfo.avatar = resolve(userInfo.avatar);
    that.setData({ userInfo: userInfo });

    // 企业信息
    cached.cachedGet('/api/v1/enterprise/company-info', {}, {
      ttl: 10 * 60 * 1000,
      onUpdate: function(data) { if (data) { if (data.logo) data.logo = resolve(data.logo); that.setData({ companyInfo: data }); } }
    }).then(function(data) { if (data) { if (data.logo) data.logo = resolve(data.logo); that.setData({ companyInfo: data }); } }).catch(function() {});

    // 职位数
    cached.cachedGet('/api/v1/jobs/my/list', {}, {
      ttl: 5 * 60 * 1000,
      onUpdate: function(data) {
        var list = Array.isArray(data) ? data : (data.list || data.rows || []);
        that.setData({ 'stats.jobs': list.length });
      }
    }).then(function(data) {
      var list = Array.isArray(data) ? data : (data.list || data.rows || []);
      that.setData({ 'stats.jobs': list.length });
    }).catch(function() {});

    // 投递数
    cached.cachedGet('/api/v1/enterprise/applications', {}, {
      ttl: 5 * 60 * 1000,
      onUpdate: function(data) { that.setData({ 'stats.applications': (data || []).length }); }
    }).then(function(data) { that.setData({ 'stats.applications': (data || []).length }); }).catch(function() {});

    // 收藏数
    cached.cachedGet('/api/v1/enterprise/favorites', {}, {
      ttl: 5 * 60 * 1000,
      onUpdate: function(data) { that.setData({ 'stats.favorites': (data.list || []).length }); }
    }).then(function(data) { that.setData({ 'stats.favorites': (data.list || []).length }); }).catch(function() {});
  },

  goEditProfile: function() {
    wx.navigateTo({ url: '/pages/edit-profile/edit-profile' });
  },

  goEditCompany: function() {
    wx.navigateTo({ url: '/pages/edit-company/edit-company' });
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
  },

  onShareAppMessage() {
    return { title: '企业中心 - 招聘管理', path: '/pages/enterprise-my/enterprise-my' };
  },

  onShareTimeline() {
    return { title: '企业中心 - 招聘管理' };
  }
});
