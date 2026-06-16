Page({
  data: { role: 'user' },

  selectRole(e) {
    this.setData({ role: e.currentTarget.dataset.role });
  },

  phoneLogin() {
    wx.navigateTo({ url: `/pages/login-phone/login-phone?role=${this.data.role}` });
  },

  goRegister() {
    wx.navigateTo({ url: `/pages/register/register?role=${this.data.role}` });
  },

  goBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 });
    } else {
      wx.switchTab({ url: '/pages/home/home' });
    }
  },
});
