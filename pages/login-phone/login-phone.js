// pages/login-phone/login-phone.js
const { auth } = require('../../utils/api.js');

Page({
  data: {
    phone: '',
    password: ''
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
    
    if (!phone) {
      wx.showToast({ title: '请输入手机号', icon: 'none' });
      return;
    }
    
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }
    
    if (!this.data.password) {
      wx.showToast({ title: '请输入密码', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '登录中...' });
    
    try {
      const result = await auth.login(phone, this.data.password);
      
      wx.hideLoading();
      
      // 更新全局用户状态
      const app = getApp();
      app.updateUserState(result.user, result.token);
      
      if (result.isNewUser) {
        wx.showToast({ title: '新用户，已自动注册', icon: 'success' });
      } else {
        wx.showToast({ title: '登录成功', icon: 'success' });
      }
      
      const userType = result.user.userType;
      
      setTimeout(() => {
        if (userType === 'enterprise' || userType === 'admin') {
          wx.reLaunch({ url: '/pages/enterprise-home/enterprise-home' });
        } else {
          wx.switchTab({ url: '/pages/home/home' });
        }
      }, 1500);
    } catch (error) {
      wx.hideLoading();
      wx.showToast({ title: error.message || '登录失败', icon: 'none' });
    }
  }
});