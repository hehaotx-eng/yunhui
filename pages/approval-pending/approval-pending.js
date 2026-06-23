var api = require('../../utils/api');

Page({
  data: {
    companyName: ''
  },

  onLoad: function() {
    var userInfo = wx.getStorageSync('userInfo') || {};
    this.setData({ companyName: userInfo.company_name || '' });
    this.loadCompanyInfo();
  },

  loadCompanyInfo: function() {
    var that = this;
    api.request({ url: '/api/v1/enterprise/company-info' }).then(function(data) {
      if (data && data.name) that.setData({ companyName: data.name });
    }).catch(function() {});
  },

  checkStatus: function() {
    var that = this;
    wx.showLoading({ title: '检查中...' });
    // 重新获取用户信息
    api.request({ url: '/api/v1/users/me' }).then(function(userInfo) {
      var app = getApp();
      app.globalData.userInfo = userInfo;
      wx.setStorageSync('userInfo', userInfo);

      if (!userInfo.company_id) {
        wx.hideLoading();
        return;
      }

      // 检查企业状态
      api.request({ url: '/api/v1/enterprise/company-info' }).then(function(company) {
        wx.hideLoading();
        if (company && company.status === 'approved') {
          wx.showToast({ title: '审核已通过', icon: 'success' });
          setTimeout(function() {
            wx.reLaunch({ url: '/pages/enterprise-home/enterprise-home' });
          }, 800);
        } else if (company && company.status === 'rejected') {
          wx.showModal({
            title: '审核未通过',
            content: '很抱歉，您的企业审核未通过。请修改企业信息后重新提交，或联系客服。',
            showCancel: false,
            confirmText: '知道了'
          });
        } else {
          wx.showToast({ title: '仍在审核中', icon: 'none' });
        }
      }).catch(function() {
        wx.hideLoading();
        wx.showToast({ title: '检查失败', icon: 'none' });
      });
    }).catch(function() {
      wx.hideLoading();
      wx.showToast({ title: '检查失败', icon: 'none' });
    });
  },

  logout: function() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: function(res) {
        if (res.confirm) {
          var app = getApp();
          app.clearUserState();
          wx.reLaunch({ url: '/pages/login/login' });
        }
      }
    });
  }
});
