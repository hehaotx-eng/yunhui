// pages/login/login.js
const { auth } = require('../../utils/api.js');

Page({
  phoneLogin() {
    wx.navigateTo({ url: '/pages/login-phone/login-phone' });
  },

  async onGetPhoneNumber(e) {
    if (e.detail.errMsg !== 'getPhoneNumber:ok') {
      wx.showToast({ title: '您取消了授权', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '登录中...' });

    try {
      if (e.detail.code) {
        await auth.wechatLogin({
          code: e.detail.code,
          encryptedData: e.detail.encryptedData || '',
          iv: e.detail.iv || ''
        });
      } else {
        const loginRes = await new Promise((resolve, reject) => {
          wx.login({ success: resolve, fail: reject });
        });
        await auth.wechatLogin({
          code: loginRes.code,
          encryptedData: e.detail.encryptedData,
          iv: e.detail.iv
        });
      }

      wx.hideLoading();
      wx.showToast({ title: '登录成功', icon: 'success' });
      setTimeout(() => {
        wx.switchTab({ url: '/pages/home/home' });
      }, 1000);
    } catch (error) {
      wx.hideLoading();
      wx.showToast({ title: error.message || '登录失败', icon: 'none' });
    }
  }
});