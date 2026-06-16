const { ai, auth } = require('../../services/index');

Page({
  data: {
    statusBarHeight: 0,
    skeleton: true,
    loading: false,
    loadingMore: false,
    list: [],
    page: 1,
    hasMore: true,
    totalCount: 0,
    matchCount: 0,
    activeFilter: 'all',
    filters: [
      { key: 'all', label: '全部' },
      { key: 'high', label: '高匹配' },
      { key: 'new', label: '最新' },
      { key: 'salary', label: '薪资优先' }
    ]
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20 });
    this.loadRecommendations();
  },

  onShow() {
    this.syncTabBar();
  },

  onPullDownRefresh() {
    this.setData({ page: 1, hasMore: true, list: [] });
    this.loadRecommendations().finally(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.setData({ page: this.data.page + 1 });
      this.loadMore();
    }
  },

  async loadRecommendations() {
    if (!auth.isLoggedIn()) {
      this.setData({ skeleton: false, list: [] });
      return;
    }

    this.setData({ skeleton: true });
    try {
      const feed = await ai.getRecommendationFeed();
      const list = feed.list;
      this.setData({
        list,
        totalCount: list.length,
        matchCount: list.filter(i => (i.payload.match_score || 0) >= 80).length,
        hasMore: feed.has_more
      });
    } catch (e) {
      console.error('加载推荐失败:', e);
    } finally {
      this.setData({ skeleton: false });
    }
  },

  async loadMore() {
    this.setData({ loadingMore: true });
    setTimeout(() => {
      this.setData({ loadingMore: false, hasMore: false });
    }, 500);
  },

  onRefresh() {
    this.setData({ page: 1, list: [] });
    this.loadRecommendations();
  },

  onFilterTap(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ activeFilter: key });
  },

  goDetail(e) {
    wx.navigateTo({ url: `/pages/detail/detail?id=${e.detail.id}` });
  },

  goCompany(e) {
    if (e.detail.id) {
      wx.navigateTo({ url: `/pages/enterprise-detail/enterprise-detail?id=${e.detail.id}` });
    }
  },

  onCardAction(e) {
    const { action, id } = e.detail;
    if (!auth.isLoggedIn()) {
      wx.navigateTo({ url: '/pages/login-phone/login-phone' });
      return;
    }
    if (action === 'apply') {
      wx.showToast({ title: '已表达兴趣', icon: 'success' });
    }
  },

  syncTabBar() {
    const app = getApp();
    const tabBar = this.getTabBar();
    if (tabBar) {
      tabBar.setRole(app.globalData.isEnterprise ? 'enterprise' : 'user');
      tabBar.setSelected(2);
    }
  }
});
