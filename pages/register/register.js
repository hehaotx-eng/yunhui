const { auth } = require('../../utils/api.js');

Page({
  data: {
    role: 'user',
    agreed: false,
    form: {
      username: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      contactName: '',
      contactPhone: '',
      address: ''
    }
  },

  goBack(e){
    wx.navigateBack({
      delta: 0,
      success: (res) => {},
      fail: (res) => {},
      complete: (res) => {},
    })
  },

  onLoad(options) {
    if (options.role === 'enterprise') this.setData({ role: 'enterprise' });
  },

  setRole(e) {
    this.setData({ role: e.currentTarget.dataset.role });
  },

  onInput(e) {
    this.setData({ [`form.${e.currentTarget.dataset.field}`]: e.detail.value });
  },

  toggleAgree() {
    this.setData({ agreed: !this.data.agreed });
  },

  validate() {
    const form = this.data.form;
    if (!this.data.agreed) return '请先同意用户协议';
    if (!form.password || form.password.length < 6) return '密码至少 6 位';
    if (form.password !== form.confirmPassword) return '两次密码不一致';
    if (this.data.role === 'user') {
      if (!form.username.trim()) return '请输入用户名';
      if (!form.phone.trim()) return '请输入手机号';
    } else {
      if (!form.username.trim()) return '请输入用户名';
      if (!form.phone.trim()) return '请输入手机号';
      if (!form.name.trim()) return '请输入企业名称';
    }
    return '';
  },

  async handleRegister() {
    const message = this.validate();
    if (message) {
      wx.showToast({ title: message, icon: 'none' });
      return;
    }

    wx.showLoading({ title: '提交中' });
    try {
      const form = this.data.form;
      if (this.data.role === 'user') {
        await auth.register({
          username: form.username,
          phone: form.phone,
          email: form.email,
          password: form.password,
          role: 'user'
        });
      } else {
        await auth.register({
          username: form.username,
          phone: form.phone,
          password: form.password,
          role: 'enterprise',
          enterpriseName: form.name,
          contactName: form.contactName || null,
          contactPhone: form.contactPhone || null,
          email: form.email || null,
          address: form.address || null
        });
      }
      wx.showToast({ title: '注册成功', icon: 'success' });
      setTimeout(() => wx.navigateTo({ url: '/pages/login-phone/login-phone' }), 800);
    } catch (error) {
      wx.showToast({ title: error.message || '注册失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/login-phone/login-phone' });
  }
});
