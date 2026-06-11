Page({
  phoneLogin() {
    wx.navigateTo({ url: '/pages/login-phone/login-phone' });
  },
  goRegister() {
    wx.navigateTo({ url: '/pages/register/register' });
  },
  goBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack({
        delta: 1
      })
    } else {
      wx.switchTab({
        url: '/pages/home/home'
      })
    }
  },
});
