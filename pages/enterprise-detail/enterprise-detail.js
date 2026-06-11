const { enterprises, jobs } = require('../../utils/api.js');

Page({
  data: {
    id: '',
    enterprise: null,
    jobs: []
  },

  onLoad(options) {
    this.setData({ id: options.id });
    this.loadData();
  },

  onPullDownRefresh() {
    wx.removeStorageSync('currentEnterprise');
    this.loadData().finally(() => wx.stopPullDownRefresh());
  },

  async loadData() {
    if (!this.data.id) return;
    
    try {
      let enterprise = wx.getStorageSync('currentEnterprise');
      
      if (!enterprise || enterprise.id != this.data.id) {
        enterprise = await enterprises.getById(this.data.id);
        wx.setStorageSync('currentEnterprise', enterprise);
      }
      
      const result = await jobs.getAll({ enterpriseId: this.data.id, page: 1, pageSize: 20 });
      this.setData({
        enterprise,
        jobs: Array.isArray(result) ? result : (result.data || result.list || [])
      });
    } catch (error) {
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    }
  },

  goJob(e) {
    wx.navigateTo({ url: `/pages/detail/detail?id=${e.currentTarget.dataset.id}` });
  },

  callPhone() {
    const phone = this.data.enterprise && this.data.enterprise.contactPhone;
    if (phone) wx.makePhoneCall({ phoneNumber: phone });
  }
});