const { enterprises } = require('../../utils/api.js');
const { resolve } = require('../../utils/image.js');

Page({
  data: {
    statusBarHeight: 0,
    keyword: '',
    companies: [],
    loading: false,
    loadingMore: false,
    hasMore: false,
    showEmpty: false,
    skeleton: true
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20 });
    this.initCompanies();
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
    this.initCompanies().finally(() => wx.stopPullDownRefresh());
  },

  async initCompanies() {
    this.setData({ skeleton: true, loading: true, showEmpty: false, companies: [] });
    try {
      const result = await enterprises.getList();
      let rawList = Array.isArray(result) ? result : (result.list || result.data || []);

      // 客户端过滤
      if (this.data.keyword) {
        const kw = this.data.keyword.toLowerCase();
        rawList = rawList.filter(function(item) {
          return (item.name && item.name.toLowerCase().indexOf(kw) !== -1) ||
                 (item.description && item.description.toLowerCase().indexOf(kw) !== -1);
        });
      }

      const list = rawList.map(function(item) {
        return {
          ...item,
          _logo: resolve(item.logo || '')
        };
      });

      this.setData({
        companies: list,
        showEmpty: list.length === 0,
        hasMore: false
      });
    } catch (e) {
      console.error('加载公司列表失败:', e);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ skeleton: false, loading: false });
    }
  },

  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  clearKeyword() {
    this.setData({ keyword: '' });
    this.initCompanies();
  },

  onSearch() {
    this.initCompanies();
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/enterprise-detail/enterprise-detail?id=${id}` });
  }
});
