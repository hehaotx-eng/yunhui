// pages/register/register.js
const { auth } = require('../../utils/api.js');

Page({
  data: {
    role: 'user',
    agreed: false,
    form: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      name: '',
      contact: '',
      address: ''
    }
  },

  setRole(role) {
    this.setData({ role });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  toggleAgree() {
    this.setData({ agreed: !this.data.agreed });
  },

  validateUserForm() {
    const { username, email, password, confirmPassword } = this.data.form;
    
    if (!username.trim()) {
      wx.showToast({ title: '请输入用户名', icon: 'none' });
      return false;
    }
    
    if (!email.trim()) {
      wx.showToast({ title: '请输入邮箱', icon: 'none' });
      return false;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      wx.showToast({ title: '请输入正确的邮箱格式', icon: 'none' });
      return false;
    }
    
    if (!password) {
      wx.showToast({ title: '请输入密码', icon: 'none' });
      return false;
    }
    
    if (password.length < 6) {
      wx.showToast({ title: '密码长度不能少于6位', icon: 'none' });
      return false;
    }
    
    if (password !== confirmPassword) {
      wx.showToast({ title: '两次输入的密码不一致', icon: 'none' });
      return false;
    }
    
    if (!this.data.agreed) {
      wx.showToast({ title: '请同意用户协议', icon: 'none' });
      return false;
    }
    
    return true;
  },

  validateEnterpriseForm() {
    const { name, contact, email, password, confirmPassword, address } = this.data.form;
    
    if (!name.trim()) {
      wx.showToast({ title: '请输入企业名称', icon: 'none' });
      return false;
    }
    
    if (!contact.trim()) {
      wx.showToast({ title: '请输入联系人', icon: 'none' });
      return false;
    }
    
    if (!email.trim()) {
      wx.showToast({ title: '请输入邮箱', icon: 'none' });
      return false;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      wx.showToast({ title: '请输入正确的邮箱格式', icon: 'none' });
      return false;
    }
    
    if (!password) {
      wx.showToast({ title: '请输入密码', icon: 'none' });
      return false;
    }
    
    if (password.length < 6) {
      wx.showToast({ title: '密码长度不能少于6位', icon: 'none' });
      return false;
    }
    
    if (password !== confirmPassword) {
      wx.showToast({ title: '两次输入的密码不一致', icon: 'none' });
      return false;
    }
    
    if (!address.trim()) {
      wx.showToast({ title: '请输入企业地址', icon: 'none' });
      return false;
    }
    
    if (!this.data.agreed) {
      wx.showToast({ title: '请同意用户协议', icon: 'none' });
      return false;
    }
    
    return true;
  },

  async handleRegister() {
    if (this.data.role === 'user') {
      if (!this.validateUserForm()) return;
      
      wx.showLoading({ title: '注册中...' });
      
      try {
        const { username, email, password } = this.data.form;
        await auth.registerUser(username, email, password);
        
        wx.hideLoading();
        wx.showToast({ title: '注册成功', icon: 'success' });
        
        setTimeout(() => {
          wx.navigateTo({ url: '/pages/login/login' });
        }, 1500);
      } catch (error) {
        wx.hideLoading();
        wx.showToast({ title: error.message || '注册失败', icon: 'none' });
      }
    } else {
      if (!this.validateEnterpriseForm()) return;
      
      wx.showLoading({ title: '注册中...' });
      
      try {
        const { name, contact, email, password, phone, address } = this.data.form;
        await auth.registerEnterprise({ name, contact, email, password, phone, address });
        
        wx.hideLoading();
        wx.showToast({ title: '企业注册成功，等待审核', icon: 'success' });
        
        setTimeout(() => {
          wx.navigateTo({ url: '/pages/login/login' });
        }, 1500);
      } catch (error) {
        wx.hideLoading();
        wx.showToast({ title: error.message || '注册失败', icon: 'none' });
      }
    }
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  }
});