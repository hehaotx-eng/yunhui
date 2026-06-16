const { jobs, applications } = require('../../utils/api.js');

Page({
  data: {
    stats: { applicants: 0, jobs: 0 },
    myJobs: [],
    loading: false,
    statusBarHeight: 0
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20 });
    this.checkUserRole();
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  checkUserRole() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    if (!userInfo.company_id) {
      wx.reLaunch({ url: '/pages/login-phone/login-phone' });
    }
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      const myJobs = await jobs.getMyList();
      const jobList = Array.isArray(myJobs) ? myJobs : (myJobs.list || myJobs.rows || []);

      let totalApplicants = 0;
      for (const job of jobList.slice(0, 5)) {
        try {
          const apps = await applications.getByJob(job.id, { limit: 1 });
          totalApplicants += apps.total || 0;
        } catch {}
      }

      this.setData({
        myJobs: jobList.slice(0, 5),
        stats: { applicants: totalApplicants, jobs: jobList.length }
      });
    } catch (e) {
      console.error('加载数据失败:', e);
    } finally {
      this.setData({ loading: false });
    }
  },

  goPostJob() {
    wx.navigateTo({ url: '/pages/post-job/post-job' });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  }
});
