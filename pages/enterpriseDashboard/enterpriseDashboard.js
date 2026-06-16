const { request } = require('../../utils/api.js');

Page({
  data: {
    stats: null,
    recentApplications: [],
    loading: true,
    statusBarHeight: 0
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20 });
    this.checkUserRole();
    this.loadData();
  },

  onShow() {},

  checkUserRole() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    if (!userInfo.company_id) {
      wx.reLaunch({ url: '/pages/login-phone/login-phone' });
    }
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      const overview = await request({ url: '/api/v1/enterprise/dashboard' });
      this.setData({
        stats: overview.jobs,
        applicationStats: overview.applications,
        candidates: overview.candidates,
        recentApplications: overview.recentApplications || []
      });
    } catch (e) {
      console.error('加载数据失败:', e);
    } finally {
      this.setData({ loading: false });
    }
  },

  goJobs() { wx.switchTab({ url: '/pages/enterprise-jobs/enterprise-jobs' }); },
  goApplications() { wx.navigateTo({ url: '/pages/candidates/candidates' }); },
  goCandidates() { wx.navigateTo({ url: '/pages/candidates/candidates' }); },
  goPostJob() { wx.navigateTo({ url: '/pages/post-job/post-job' }); },
  goApplicationDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/candidates/candidates?application_id=${id}` });
  }

});
