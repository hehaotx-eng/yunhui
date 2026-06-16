const { enterprises } = require('../../utils/api.js');
const { resolve } = require('../../utils/image');

Page({
  data: {
    statusBarHeight: 0,
    id: '',
    enterprise: null,
    jobs: []
  },

  onLoad(options) {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20, id: options.id });
    this.loadData();
  },

  onPullDownRefresh() {
    this.loadData().finally(() => wx.stopPullDownRefresh());
  },

  async loadData() {
    if (!this.data.id) return;
    try {
      const enterprise = await enterprises.getById(this.data.id);
      if (enterprise.logo) enterprise.logo = resolve(enterprise.logo);
      if (enterprise.company_logo) enterprise.company_logo = resolve(enterprise.company_logo);
      if (enterprise.company_images) {
        enterprise.company_images = enterprise.company_images.map(resolve);
      }
      this.setData({ enterprise, jobs: enterprise.jobs || [] });
    } catch (error) {
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    }
  },

  goBack() {
    wx.navigateBack();
  },

  goJob(e) {
    const id = e.currentTarget.dataset.id;
    if (id) wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },

  callPhone() {
    const phone = this.data.enterprise?.contact_phone || this.data.enterprise?.contactPhone;
    if (phone) wx.makePhoneCall({ phoneNumber: phone });
  }
});