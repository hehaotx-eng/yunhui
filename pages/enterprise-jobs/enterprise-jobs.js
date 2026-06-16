const { jobs } = require('../../utils/api.js');

Page({
  data: {
    activeTab: 'all',
    tabs: [
      { id: 'all', name: '全部' },
      { id: 'online', name: '在线' },
      { id: 'offline', name: '下线' },
      { id: 'draft', name: '草稿' }
    ],
    allJobs: [],
    jobs: [],
    showEmpty: false,
    loading: false,
    statusBarHeight: 0
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20 });
    this.checkUserRole();
    this.loadJobs();
  },

  onShow() {
    this.loadJobs();
  },

  checkUserRole() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    if (!userInfo.company_id) {
      wx.reLaunch({ url: '/pages/login-phone/login-phone' });
    }
  },

  async loadJobs() {
    this.setData({ loading: true });
    try {
      const result = await jobs.getMyList();
      const list = Array.isArray(result) ? result : (result.list || result.rows || []);
      this.setData({ allJobs: list });
      this.filterJobs();
    } catch (e) {
      console.error('加载职位失败:', e);
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  filterJobs() {
    const { activeTab, allJobs } = this.data;
    let filtered = allJobs;
    if (activeTab !== 'all') {
      filtered = allJobs.filter(j => j.status === activeTab);
    }
    this.setData({ jobs: filtered, showEmpty: filtered.length === 0 });
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
    this.filterJobs();
  },

  goPostJob() {
    wx.navigateTo({ url: '/pages/post-job/post-job' });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },

  async goOffline(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认下线',
      content: '确定要下线这个职位吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await jobs.update(id, { status: 'offline' });
            wx.showToast({ title: '已下线', icon: 'success' });
            this.loadJobs();
          } catch (e) {
            wx.showToast({ title: e.message || '操作失败', icon: 'none' });
          }
        }
      }
    });
  },

  async goOnline(e) {
    const id = e.currentTarget.dataset.id;
    try {
      await jobs.update(id, { status: 'online' });
      wx.showToast({ title: '已上线', icon: 'success' });
      this.loadJobs();
    } catch (e) {
      wx.showToast({ title: e.message || '操作失败', icon: 'none' });
    }
  }
});
