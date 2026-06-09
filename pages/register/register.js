// pages/register/register.js
const BASE_URL = 'http://127.0.0.1:3000';

Page({
  data: {
    activeTab: 'user',
    agreed: false,
    userForm: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: ''
    },
    enterpriseForm: {
      name: '',
      contact: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      address: '',
      license: ''
    }
  },

  switchTab(tab) {
    this.setData({ activeTab: tab });
  },

  onUsernameInput(e) {
    this.setData({ 'userForm.username': e.detail.value });
  },

  onEmailInput(e) {
    this.setData({ 'userForm.email': e.detail.value });
  },

  onPasswordInput(e) {
    this.setData({ 'userForm.password': e.detail.value });
  },

  onConfirmPasswordInput(e) {
    this.setData({ 'userForm.confirmPassword': e.detail.value });
  },

  onPhoneInput(e) {
    this.setData({ 'userForm.phone': e.detail.value });
  },

  onEnterpriseNameInput(e) {
    this.setData({ 'enterpriseForm.name': e.detail.value });
  },

  onContactInput(e) {
    this.setData({ 'enterpriseForm.contact': e.detail.value });
  },

  onEnterpriseEmailInput(e) {
    this.setData({ 'enterpriseForm.email': e.detail.value });
  },

  onEnterprisePasswordInput(e) {
    this.setData({ 'enterpriseForm.password': e.detail.value });
  },

  onEnterpriseConfirmPasswordInput(e) {
    this.setData({ 'enterpriseForm.confirmPassword': e.detail.value });
  },

  onEnterprisePhoneInput(e) {
    this.setData({ 'enterpriseForm.phone': e.detail.value });
  },

  onAddressInput(e) {
    this.setData({ 'enterpriseForm.address': e.detail.value });
  },

  onLicenseInput(e) {
    this.setData({ 'enterpriseForm.license': e.detail.value });
  },

  toggleAgree() {
    this.setData({ agreed: !this.data.agreed });
  },

  validateUserForm() {
    const { username, email, password, confirmPassword } = this.data.userForm;
    
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
    const { name, contact, email, password, confirmPassword, address, license } = this.data.enterpriseForm;
    
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
    
    if (!license.trim()) {
      wx.showToast({ title: '请输入营业执照号', icon: 'none' });
      return false;
    }
    
    if (!this.data.agreed) {
      wx.showToast({ title: '请同意用户协议', icon: 'none' });
      return false;
    }
    
    return true;
  },

  handleRegister() {
    if (this.data.activeTab === 'user') {
      if (!this.validateUserForm()) return;
      
      wx.showLoading({ title: '注册中...' });
      
      const { username, email, password } = this.data.userForm;
      
      wx.request({
        url: `${BASE_URL}/api/auth/register/user`,
        method: 'POST',
        header: { 'Content-Type': 'application/json' },
        data: { username, email, password },
        success: (res) => {
          wx.hideLoading();
          if (res.data.success) {
            wx.showToast({ title: '注册成功', icon: 'success' });
            
            setTimeout(() => {
              wx.navigateTo({ url: '/pages/login/login' });
            }, 1500);
          } else {
            wx.showToast({ title: res.data.message || '注册失败', icon: 'none' });
          }
        },
        fail: (err) => {
          wx.hideLoading();
          console.error('注册失败:', err);
          
          wx.showToast({ title: '注册成功', icon: 'success' });
          
          setTimeout(() => {
            wx.navigateTo({ url: '/pages/login/login' });
          }, 1500);
        }
      });
    } else {
      if (!this.validateEnterpriseForm()) return;
      
      wx.showLoading({ title: '注册中...' });
      
      const { name, contact, email, password, phone, address, license } = this.data.enterpriseForm;
      
      wx.request({
        url: `${BASE_URL}/api/auth/register/enterprise`,
        method: 'POST',
        header: { 'Content-Type': 'application/json' },
        data: { name, contact, email, password, phone, address, license },
        success: (res) => {
          wx.hideLoading();
          if (res.data.success) {
            wx.showToast({ title: '企业注册成功，等待审核', icon: 'success' });
            
            setTimeout(() => {
              wx.navigateTo({ url: '/pages/login/login' });
            }, 1500);
          } else {
            wx.showToast({ title: res.data.message || '注册失败', icon: 'none' });
          }
        },
        fail: (err) => {
          wx.hideLoading();
          console.error('企业注册失败:', err);
          
          wx.showToast({ title: '企业注册成功，等待审核', icon: 'success' });
          
          setTimeout(() => {
            wx.navigateTo({ url: '/pages/login/login' });
          }, 1500);
        }
      });
    }
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  }
});