var api = require('../../utils/api');

Page({
  data: {},

  wxLogin: function() {
    wx.showLoading({ title: '登录中...' });
    wx.login({
      success: function(loginRes) {
        if (!loginRes.code) {
          wx.hideLoading();
          wx.showToast({ title: '微信登录失败', icon: 'none' });
          return;
        }
        api.request({
          url: '/api/v1/users/wx-login',
          method: 'POST',
          data: { code: loginRes.code },
          needAuth: false
        }).then(function(data) {
          var token = data.token;
          if (!token) {
            wx.hideLoading();
            wx.showToast({ title: '登录失败', icon: 'none' });
            return;
          }
          wx.setStorageSync('token', token);
          api.request({ url: '/api/v1/users/me' }).then(function(userInfo) {
            var app = getApp();
            app.updateUserState(userInfo, token);
            wx.hideLoading();

            if (data.isNew) {
              wx.redirectTo({ url: '/pages/complete-profile/complete-profile' });
            } else if (userInfo.company_id) {
              // 企业用户 → 检查企业审核状态
              api.request({ url: '/api/v1/enterprise/company-info' }).then(function(company) {
                if (company && company.status === 'approved') {
                  wx.reLaunch({ url: '/pages/enterprise-home/enterprise-home' });
                } else {
                  wx.redirectTo({ url: '/pages/approval-pending/approval-pending' });
                }
              }).catch(function() {
                wx.reLaunch({ url: '/pages/enterprise-home/enterprise-home' });
              });
            } else {
              wx.showToast({ title: '登录成功', icon: 'success' });
              setTimeout(function() { wx.switchTab({ url: '/pages/home/home' }); }, 800);
            }
          }).catch(function() {
            wx.hideLoading();
            wx.showToast({ title: '获取信息失败', icon: 'none' });
          });
        }).catch(function(e) {
          wx.hideLoading();
          wx.showToast({ title: e.message || '登录失败', icon: 'none' });
        });
      },
      fail: function() {
        wx.hideLoading();
        wx.showToast({ title: '微信登录失败', icon: 'none' });
      }
    });
  },

  phoneLogin: function() {
    wx.navigateTo({ url: '/pages/login-phone/login-phone' });
  },

  goBack: function() {
    var pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
    } else {
      wx.switchTab({ url: '/pages/home/home' });
    }
  }
});
