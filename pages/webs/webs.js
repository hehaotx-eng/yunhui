const { jobs, ai } = require('../../utils/api.js');

Page({
  data: {
    keyword: '',
    aiQuery: '',
    showAiSearch: false,
    aiSuggestions: [
      '前端开发 15000以上',
      '产品经理 双休',
      '设计师 远程办公',
      'Java工程师 3年以上经验'
    ],
    activeCity: '',
    cities: ['北京', '上海', '广州', '深圳', '杭州', '成都', '南京', '武汉', '西安', '苏州'],
    jobs: [],
    page: 1,
    pageSize: 10,
    loading: false,
    loadingMore: false,
    hasMore: true,
    showEmpty: false,
    skeleton: true,
    isAiSearch: false
  },

  onLoad() {
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
      let result;
      if (this.data.isAiSearch && this.data.aiQuery) {
        result = await jobs.aiSearch({ query: this.data.aiQuery, page, limit: this.data.pageSize });
      } else {
        result = await jobs.getAll(params);
      }

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
    this.setData({ isAiSearch: false });
    this.initJobs();
  },

  toggleAiSearch() {
    this.setData({ showAiSearch: !this.data.showAiSearch });
  },

  onAiInput(e) {
    this.setData({ aiQuery: e.detail.value });
  },

  useAiSuggestion(e) {
    const text = e.currentTarget.dataset.text;
    this.setData({ aiQuery: text });
  },

  doAiSearch() {
    if (!this.data.aiQuery) {
      wx.showToast({ title: '请输入搜索内容', icon: 'none' });
      return;
    }
    this.setData({ isAiSearch: true, showAiSearch: false });
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
