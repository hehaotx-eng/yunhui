const { auth, enterprises: enterpriseApi } = require('../../utils/api.js');

Page({
  data: {
    role: 'user',
    phone: '',
    password: '',
    showCompanyDialog: false,
    enterprises: [],
    createMode: false,
    createForm: { name: '', industry: '', scale: '', description: '' }
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

  onCreateInput(e) {
    this.setData({ [`createForm.${e.currentTarget.dataset.field}`]: e.detail.value });
  },

  async handleLogin() {
    const phone = this.data.phone.replace(/\s/g, '');
    if (!phone) { wx.showToast({ title: '请输入手机号', icon: 'none' }); return; }
    if (!/^1[3-9]\d{9}$/.test(phone)) { wx.showToast({ title: '请输入正确的手机号', icon: 'none' }); return; }
    if (!this.data.password) { wx.showToast({ title: '请输入密码', icon: 'none' }); return; }

    wx.showLoading({ title: '登录中...' });
    try {
      const loginData = await auth.login(phone, this.data.password);
      const userInfo = await auth.getMe();
      const app = getApp();
      app.updateUserState(userInfo, loginData.token);
      wx.hideLoading();

      if (this.data.role === 'enterprise' && !userInfo.company_id) {
        this.showEnterpriseDialog();
      } else {
        wx.showToast({ title: '登录成功', icon: 'success' });
        setTimeout(() => this.redirect(userInfo.company_id), 800);
      }
    } catch (error) {
      wx.hideLoading();
      wx.showToast({ title: error.message || '登录失败', icon: 'none' });
    }
  },

  redirect(companyId) {
    if (companyId) {
      wx.reLaunch({ url: '/pages/enterprise-home/enterprise-home' });
    } else {
      wx.switchTab({ url: '/pages/home/home' });
    }
  },

  async showEnterpriseDialog() {
    this.setData({ showCompanyDialog: true, createMode: false, createForm: { name: '', industry: '', scale: '', description: '' } });
    try {
      const result = await enterpriseApi.getList();
      this.setData({ enterprises: Array.isArray(result) ? result : [] });
    } catch { this.setData({ enterprises: [] }); }
  },

  closeDialog() {
    this.setData({ showCompanyDialog: false });
  },

  switchCreateMode() {
    this.setData({ createMode: !this.data.createMode });
  },

  async handleJoin(e) {
    const id = e.currentTarget.dataset.id;
    wx.showLoading({ title: '加入中...' });
    try {
      await enterpriseApi.join(id);
      const userInfo = await auth.getMe();
      getApp().updateUserState(userInfo, wx.getStorageSync('token'));
      wx.hideLoading();
      wx.showToast({ title: '加入成功', icon: 'success' });
      this.setData({ showCompanyDialog: false });
      setTimeout(() => wx.reLaunch({ url: '/pages/enterprise-home/enterprise-home' }), 800);
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: err.message || '加入失败', icon: 'none' });
    }
  },

  async handleCreate() {
    const form = this.data.createForm;
    if (!form.name.trim()) { wx.showToast({ title: '请输入企业名称', icon: 'none' }); return; }
    wx.showLoading({ title: '创建中...' });
    try {
      await enterpriseApi.create({ name: form.name, industry: form.industry, scale: form.scale, description: form.description });
      const userInfo = await auth.getMe();
      getApp().updateUserState(userInfo, wx.getStorageSync('token'));
      wx.hideLoading();
      wx.showToast({ title: '创建成功', icon: 'success' });
      this.setData({ showCompanyDialog: false });
      setTimeout(() => wx.reLaunch({ url: '/pages/enterprise-home/enterprise-home' }), 800);
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: err.message || '创建失败', icon: 'none' });
    }
  }
});
