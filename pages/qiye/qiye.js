const { enterprises } = require('../../utils/api.js');
const { checkAuth } = require('../../utils/auth-check.js');

Page({
  data: {
    keyword: '',
    activeFilter: 'all',
    filters: [
      { id: 'all', name: '全部' },
      { id: 'verified', name: '已认证' },
      { id: 'hot', name: '热门' },
      { id: 'new', name: '新入驻' }
    ],
    enterprises: [],
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
    
    this.loadEnterprises(true);
  },

  onShow() {
    // 检测用户身份
    const authResult = checkAuth(this, { redirectIfEnterprise: true });
    if (authResult.blocked) return;
  },

  onPullDownRefresh() {
    this.loadEnterprises(true).finally(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    this.loadEnterprises();
  },

  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  onSearch() {
    this.loadEnterprises(true);
  },

  switchFilter(e) {
    this.setData({ activeFilter: e.currentTarget.dataset.id });
    this.loadEnterprises(true);
  },

  async loadEnterprises(reset = false) {
    if (this.data.loading) return;
    if (!reset && !this.data.hasMore) return;
    const page = reset ? 1 : this.data.page;
    this.setData({ loading: true });
    try {
      let result;
      if (this.data.activeFilter === 'hot') {
        result = await enterprises.getHot();
      } else if (this.data.activeFilter === 'new') {
        result = await enterprises.getNew();
      } else {
        const params = {
          page,
          pageSize: this.data.pageSize,
          keyword: this.data.keyword
        };
        if (this.data.activeFilter === 'verified') {
          params.verified = true;
        }
        result = await enterprises.getAll(params);
      }
      const list = Array.isArray(result) ? result : (result.data || result.list || []);
      const newEnterprises = reset ? list : this.data.enterprises.concat(list);
      this.setData({
        enterprises: newEnterprises,
        page: page + 1,
        hasMore: ['hot', 'new'].includes(this.data.activeFilter) ? false : (list.length >= this.data.pageSize),
        loading: false,
        showEmpty: !this.data.loading && newEnterprises.length === 0,
        showNoMore: !list.length && newEnterprises.length > 0
      });
    } catch (error) {
      this.setData({ loading: false });
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    }
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    const enterprise = this.data.enterprises.find(item => item.id == id);
    if (enterprise) {
      wx.setStorageSync('currentEnterprise', enterprise);
    }
    wx.navigateTo({ url: `/pages/enterprise-detail/enterprise-detail?id=${id}` });
  }
});