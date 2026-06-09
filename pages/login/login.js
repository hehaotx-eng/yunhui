// pages/login/login.js
const { auth } = require('../../utils/api.js');

Page({
  data: {
    email: '',
    password: ''
  },

  onEmailInput(e) {
    this.setData({ email: e.detail.value });
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },

  async handleLogin() {
    if (!this.data.email) {
      wx.showToast({ title: '请输入邮箱', icon: 'none' });
      return;
    }
    if (!this.data.password) {
      wx.showToast({ title: '请输入密码', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '登录中...' });
    
    try {
      const data = await auth.login(this.data.email, this.data.password);
      
      wx.hideLoading();
      wx.showToast({ title: '登录成功', icon: 'success' });
      
      setTimeout(() => {
        wx.switchTab({ url: '/pages/home/home' });
      }, 1500);
    } catch (error) {
      wx.hideLoading();
      wx.showToast({ title: error.message || '登录失败', icon: 'none' });
    }
  },

  async goRegister() {
    wx.navigateTo({ url: '/pages/register/register' });
  },

  goForgot() {
    wx.showToast({ title: '找回密码开发中', icon: 'none' });
  },

  async onGetPhoneNumber(e) {
    if (e.detail.errMsg !== 'getPhoneNumber:ok') {
      wx.showToast({ title: '您取消了授权', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '登录中...' });

    try {
      // 新版 SDK 直接返回 code
      if (e.detail.code) {
        const result = await auth.wechatLogin({
          code: e.detail.code,
          encryptedData: e.detail.encryptedData || '',
          iv: e.detail.iv || ''
        });
      } else {
        // 旧版 SDK 返回 encryptedData 和 iv，需要先 wx.login 拿 code
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
  },


  phoneLogin() {
    wx.showToast({ title: '手机号登录开发中', icon: 'none' });
  }
});