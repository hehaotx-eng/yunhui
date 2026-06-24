const { auth, enterprises, upload } = require('../../utils/api.js');

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

  onLoad(options) {
    if (options.role === 'enterprise') {
      this.setData({ role: 'enterprise' });
    }
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
    const that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function(res) {
        const tempPath = res.tempFilePaths[0];
        wx.showLoading({ title: '上传中...' });
        upload.image(tempPath, 'company_logo').then(function(url) {
          that.setData({ 'form.logo': url });
          wx.hideLoading();
        }).catch(function() {
          wx.hideLoading();
          wx.showToast({ title: '上传失败', icon: 'none' });
        });
      }
    });
  },

  onScaleChange(e) {
    const idx = e.detail.value;
    const scale = this.data.scaleOptions[idx];
    this.setData({ 'form.scale': scale });
  },

  validate() {
    const form = this.data.form;
    if (!this.data.agreed) return '请先同意用户协议';
    if (!form.username.trim()) return '请输入用户名';
    if (!form.phone.trim()) return '请输入手机号';
    if (!/^1[3-9]\d{9}$/.test(form.phone)) return '请输入正确的手机号';
    if (!form.password || form.password.length < 6) return '密码至少 6 位';
    if (form.password !== form.confirmPassword) return '两次密码不一致';
    if (this.data.role === 'enterprise') {
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

    wx.showLoading({ title: '提交中', mask: true });
    try {
      const form = this.data.form;
      const app = getApp();

      // 1. 注册用户（后端 register 只认 phone + password + nickname）
      await auth.register({
        phone: form.phone,
        password: form.password,
        nickname: form.username
      });

      // 2. 登录获取 token
      const loginRes = await auth.login(form.phone, form.password);

      // 3. 必须先将 token 写入 storage，再调需要鉴权的 getMe
      wx.setStorageSync('token', loginRes.token);

      // 4. 获取用户信息
      const userInfo = await auth.getMe();
      app.updateUserState(userInfo, loginRes.token);

      // 5. 企业用户：创建企业
      if (this.data.role === 'enterprise') {
        const enterpriseData = {
          name: form.name,
          contact_name: form.contactName,
          contact_phone: form.contactPhone,
          address: form.address || '',
          scale: form.scale || ''
        };
        const enterpriseResult = await enterprises.create(enterpriseData);

        // 上传 Logo
        if (form.logo && enterpriseResult && enterpriseResult.id) {
          try {
            await upload.image(form.logo, 'company_logo', { company_id: enterpriseResult.id });
          } catch (e) {
            console.warn('Logo 上传失败，不影响注册', e);
          }
        }

        // 刷新用户信息（现在有 company_id 了）
        const updatedUser = await auth.getMe();
        app.updateUserState(updatedUser, loginRes.token);

        wx.showToast({ title: '注册成功，等待审核', icon: 'success' });
        setTimeout(function() {
          wx.redirectTo({ url: '/pages/approval-pending/approval-pending' });
        }, 1200);
      } else {
        // 个人用户
        wx.showToast({ title: '注册成功', icon: 'success' });
        setTimeout(function() {
          wx.switchTab({ url: '/pages/home/home' });
        }, 800);
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
