const { auth, upload } = require('../../utils/api.js');

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
      address: '',
      scale: '',
      logo: ''
    },
    scaleOptions: ['1-19人', '20-99人', '100-499人', '500-999人', '1000人以上']
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
          that.setData({ 'form.logo': url });
          wx.hideLoading();
        }).catch(function(e) {
          wx.hideLoading();
          that.setData({ 'form.logo': tempPath });
        });
      }
    });
  },

  onScaleChange(e) {
    var idx = e.detail.value;
    var scale = this.data.scaleOptions[idx];
    this.setData({ 'form.scale': scale });
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
      if (!form.contactName.trim()) return '请输入联系人';
      if (!form.contactPhone.trim()) return '请输入联系电话';
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
      // 1. 注册用户
      await auth.register({
        username: form.username,
        phone: form.phone,
        email: form.email,
        password: form.password,
        role: this.data.role
      });

      // 2. 自动登录
      const loginData = await auth.login(form.phone, form.password);
      const app = getApp();
      app.updateUserState(loginData.user, loginData.token);

      // 3. 企业用户 → 创建企业并上传Logo
      if (this.data.role === 'enterprise') {
        var enterpriseData = {
          name: form.name,
          contact_name: form.contactName,
          contact_phone: form.contactPhone,
          address: form.address || '',
          scale: form.scale || ''
        };
        var enterpriseResult = await new Promise(function(resolve, reject) {
          wx.request({
            url: require('../../config/base').BASE_URL + '/api/v1/enterprises',
            method: 'POST',
            data: enterpriseData,
            header: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + loginData.token },
            success: function(res) {
              if (res.data && (res.data.code === 0 || res.data.code === 200)) resolve(res.data.data);
              else reject(new Error((res.data && res.data.message) || '创建企业失败'));
            },
            fail: function() { reject(new Error('创建企业失败')); }
          });
        });
        // 上传Logo
        if (form.logo && enterpriseResult && enterpriseResult.id) {
          try { await upload.image(form.logo, 'company_logo', { company_id: enterpriseResult.id }); } catch(e) {}
        }
        app.globalData.isEnterprise = true;
        app.globalData.userInfo.company_id = enterpriseResult.id;
        wx.setStorageSync('userInfo', app.globalData.userInfo);
        wx.showToast({ title: '注册成功', icon: 'success' });
        setTimeout(function() { wx.redirectTo({ url: '/pages/approval-pending/approval-pending' }); }, 800);
      } else {
        wx.showToast({ title: '注册成功', icon: 'success' });
        setTimeout(function() { wx.switchTab({ url: '/pages/home/home' }); }, 800);
      }
    } catch (error) {
      wx.showToast({ title: error.message || '注册失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  }
});
