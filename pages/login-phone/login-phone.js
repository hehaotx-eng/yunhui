const { auth, enterprises: enterpriseApi, upload } = require('../../utils/api.js');

Page({
  data: {
    role: 'user',
    phone: '',
    password: '',
    showCompanyDialog: false,
    enterprises: [],
    createMode: false,
    createForm: { name: '', industry: '', scale: '', description: '', contactName: '', contactPhone: '', address: '', logo: '' }
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

      if (loginData.isNew) {
        wx.redirectTo({ url: '/pages/complete-profile/complete-profile' });
      } else if (this.data.role === 'enterprise' && !userInfo.company_id) {
        this.showEnterpriseDialog();
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
        setTimeout(() => wx.switchTab({ url: '/pages/home/home' }), 800);
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

  chooseLogo() {
    var that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function(res) {
        var tempPath = res.tempFilePaths[0];
        wx.showLoading({ title: '上传中...' });
        upload.image(tempPath, 'company_logo').then(function(url) {
          that.setData({ 'createForm.logo': url });
          wx.hideLoading();
        }).catch(function() {
          wx.hideLoading();
          that.setData({ 'createForm.logo': tempPath });
        });
      }
    });
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
    if (!form.contactName.trim()) { wx.showToast({ title: '请输入联系人', icon: 'none' }); return; }
    if (!form.contactPhone.trim()) { wx.showToast({ title: '请输入联系电话', icon: 'none' }); return; }
    wx.showLoading({ title: '创建中...' });
    try {
      var result = await enterpriseApi.create({
        name: form.name,
        contact_name: form.contactName,
        contact_phone: form.contactPhone,
        address: form.address || '',
        scale: form.scale || '',
        description: form.description || ''
      });
      if (form.logo && result && result.id) {
        try { var uploadApi = require('../../utils/api').upload; await uploadApi.image(form.logo, 'company_logo', { company_id: result.id }); } catch(e) {}
      }
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
