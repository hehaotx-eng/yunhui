const { jobs } = require('../../utils/api.js');

Page({
  data: {
    statusBarHeight: 0,
    keyword: '',
    activeCity: '',
    cities: ['北京', '上海', '广州', '深圳', '杭州', '成都', '南京', '武汉', '西安', '苏州'],
    jobs: [],
    page: 1,
    pageSize: 10,
    loading: false,
    loadingMore: false,
    hasMore: true,
    showEmpty: false,
    skeleton: true
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20 });
    this.initJobs();
  },

  onShow() {
    const app = getApp();
    const tabBar = this.getTabBar();
    if (tabBar) {
      tabBar.setRole(app.globalData.isEnterprise ? 'enterprise' : 'user');
      tabBar.setSelected(1);
    }
  },

  onPullDownRefresh() {
    this.initJobs().finally(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (!this.data.loadingMore && this.data.hasMore) {
      this.loadMoreJobs();
    }
  },

  async initJobs() {
    this.setData({ skeleton: true, loading: true, page: 1, hasMore: true, showEmpty: false, jobs: [] });
    try {
      await this.fetchJobs(1, true);
    } catch (e) {
      console.error('初始化职位失败:', e);
    } finally {
      this.setData({ skeleton: false, loading: false });
    }
  },

  async loadMoreJobs() {
    if (this.data.loadingMore || !this.data.hasMore) return;
    this.setData({ loadingMore: true });
    try {
      await this.fetchJobs(this.data.page + 1, false);
    } catch (e) {
      console.error('加载更多失败:', e);
    } finally {
      this.setData({ loadingMore: false });
    }
  },

  async fetchJobs(page, reset) {
    const params = { page, limit: this.data.pageSize };

    try {
      const result = this.data.keyword
        ? await jobs.search({ keyword: this.data.keyword, ...params })
        : await jobs.getAll(params);
      const list = result.list || result.rows || result || [];
      const newJobs = reset ? list : [...this.data.jobs, ...list];

      this.setData({
        jobs: newJobs,
        page,
        hasMore: list.length >= this.data.pageSize,
        showEmpty: newJobs.length === 0
      });
    } catch (error) {
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    }
  },

  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  clearKeyword() {
    this.setData({ keyword: '' });
    this.initJobs();
  },

  onSearch() {
    this.initJobs();
  },

  switchCity(e) {
    const city = e.currentTarget.dataset.city;
    this.setData({ activeCity: city === this.data.activeCity ? '' : city });
    this.initJobs();
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  }
});
