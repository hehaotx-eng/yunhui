Page({
  data: {
    pagePath: '',
    navTitle: ''
  },

  onLoad(options) {
    const pagePath = options.page || 'home';
    this.setData({
      pagePath,
      navTitle: options.title || ''
    });
    console.log('[custom] loading page:', pagePath, 'title:', options.title);
  },

  goBack() {
    wx.navigateBack({ delta: 1 });
  }
});
