const { jobs, applications } = require('../../utils/api.js');

Page({
  data: {
    activeFilter: 'all',
    filters: [
      { id: 'all', name: '全部' },
      { id: 'pending', name: '待处理' },
      { id: 'viewed', name: '已查看' },
      { id: 'accepted', name: '已通过' },
      { id: 'rejected', name: '已拒绝' }
    ],
    allApplications: [],
    applications: [],
    showEmpty: false,
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

      let allApps = [];
      for (const job of jobList) {
        try {
          const result = await applications.getByJob(job.id);
          const apps = result.list || result.rows || result || [];
          allApps = allApps.concat(apps.map(a => ({ ...a, job_title: job.title })));
        } catch {}
      }

      this.setData({ allApplications: allApps });
      this.filterApplications();
    } catch (e) {
      console.error('加载投递失败:', e);
    } finally {
      this.setData({ loading: false });
    }
  },

  filterApplications() {
    const { activeFilter, allApplications } = this.data;
    let filtered = allApplications;
    if (activeFilter !== 'all') {
      filtered = allApplications.filter(a => a.status === activeFilter);
    }
    this.setData({ applications: filtered, showEmpty: filtered.length === 0 });
  },

  switchFilter(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({ activeFilter: filter });
    this.filterApplications();
  },

  async updateStatus(e) {
    const { id, status } = e.currentTarget.dataset;
    try {
      await applications.updateStatus(id, status);
      wx.showToast({ title: '操作成功', icon: 'success' });
      this.loadData();
    } catch (e) {
      wx.showToast({ title: e.message || '操作失败', icon: 'none' });
    }
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  }
});
