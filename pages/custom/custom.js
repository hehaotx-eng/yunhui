Page({
  data: {
    pagePath: '',
    navTitle: '',
    statusBarHeight: 0
  },

  onLoad(options) {
    const sysInfo = wx.getSystemInfoSync();
    const pagePath = options.page || 'home';
    this.setData({
      pagePath,
      navTitle: options.title || '',
      statusBarHeight: sysInfo.statusBarHeight || 20
    });
    console.log('[custom] loading page:', pagePath, 'title:', options.title);
  },

  goBack() {
    wx.navigateBack({ delta: 1 });
  }
});
