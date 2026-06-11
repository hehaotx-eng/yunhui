const { jobs } = require('../../utils/api.js');
const { checkAuth } = require('../../utils/auth-check.js');

Page({
  data: {
    keyword: '',
    activeFilter: 'latest',
    filters: [
      { id: 'latest', name: '最新发布' },
      { id: 'salary', name: '薪资最高' },
      { id: 'nearby', name: '距离最近' },
      { id: 'fulltime', name: '全职' }
    ],
    jobs: [],
    page: 1,
    pageSize: 10,
    loading: false,
    hasMore: true,
    showEmpty: false,
    showNoMore: false
  },

  onLoad() {
    // 检测用户身份
    const authResult = checkAuth(this, { redirectIfEnterprise: true });
    if (authResult.blocked) return;
    
    this.loadJobs(true);
  },

  onShow() {
    // 检测用户身份
    const authResult = checkAuth(this, { redirectIfEnterprise: true });
    if (authResult.blocked) return;
  },

  onPullDownRefresh() {
    this.loadJobs(true).finally(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    this.loadJobs();
  },

  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  onSearch() {
    this.loadJobs(true);
  },

  switchFilter(e) {
    this.setData({ activeFilter: e.currentTarget.dataset.id });
    this.loadJobs(true);
  },

  async loadJobs(reset = false) {
    if (this.data.loading) return;
    if (!reset && !this.data.hasMore) return;

    const page = reset ? 1 : this.data.page;
    this.setData({ loading: true });

    try {
      const params = {
        page,
        pageSize: this.data.pageSize,
        keyword: this.data.keyword
      };
      if (this.data.activeFilter === 'salary') {
        params.sort = 'salary';
      } else if (this.data.activeFilter === 'nearby') {
        params.sort = 'distance';
        params.nearby = 1;
      } else if (this.data.activeFilter === 'fulltime') {
        params.workType = '全职';
      } else {
        params.sort = 'latest';
      }
      const result = await jobs.getAll(params);
      const list = Array.isArray(result) ? result : (result.data || result.list || []);
      const newJobs = reset ? list : this.data.jobs.concat(list);
      this.setData({
        jobs: newJobs,
        page: page + 1,
        hasMore: list.length >= this.data.pageSize,
        loading: false,
        showEmpty: !this.data.loading && newJobs.length === 0,
        showNoMore: !list.length && newJobs.length > 0
      });
    } catch (error) {
      this.setData({ loading: false });
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    }
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    const job = this.data.jobs.find(item => item.id == id);
    if (job) {
      wx.setStorageSync('currentJob', job);
    }
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },

  callPhone(e) {
    const phone = e.currentTarget.dataset.phone;
    if (phone) wx.makePhoneCall({ phoneNumber: phone });
  }
});