const { auth } = require('../../utils/api.js');

Page({
  data: {
    role: 'user',
    phone: '',
    password: ''
  },

  onLoad(options) {
    if (options.role === 'enterprise') this.setData({ role: 'enterprise' });
  },

  goBack() {
    wx.navigateBack();
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },

  async handleLogin() {
    const phone = this.data.phone.replace(/\s/g, '');
    if (!phone) { wx.showToast({ title: '请输入手机号', icon: 'none' }); return; }
    if (!/^1[3-9]\d{9}$/.test(phone)) { wx.showToast({ title: '请输入正确的手机号', icon: 'none' }); return; }
    if (!this.data.password) { wx.showToast({ title: '请输入密码', icon: 'none' }); return; }

    wx.showLoading({ title: '登录中...', mask: true });
    try {
      const loginData = await auth.login(phone, this.data.password);
      const userInfo = await auth.getMe();
      const app = getApp();
      app.updateUserState(userInfo, loginData.token);
      wx.hideLoading();

      wx.showToast({ title: '登录成功', icon: 'success' });
      setTimeout(() => {
        const pages = getCurrentPages();
        if (pages.length > 1) {
          wx.navigateBack();
        } else {
          wx.reLaunch({ url: '/pages/home/home' });
        }
      }, 800);
    } catch (error) {
      wx.hideLoading();
      wx.showToast({ title: error.message || '登录失败', icon: 'none' });
    }
  },

  goRegister() {
    const url = this.data.role === 'enterprise'
      ? '/pages/register/register?role=enterprise'
      : '/pages/register/register';
    wx.navigateTo({ url });
  }
});
