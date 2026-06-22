var feedStream = require('../../services/core/feedStream');
var { banners: bannerApi, categories: catApi, notifications: notifyApi, quickLinks: quickLinkApi } = require('../../utils/api');
var { resolve } = require('../../utils/image');
var vip = require('../../services/core/vip');

Page({
  data: {
    statusBarHeight: 0,
    useDynamicPage: false,
    skeleton: true,
    loading: false,
    loadingMore: false,
    activeCategory: '',
    categories: [{ id: '', name: '推荐' }],
    catScrollLeft: 0,
    catSticky: false,
    stickyStyle: '',
    banners: [],
    bannerCurrent: 0,
    notices: [],
    quickLinks: [],
    feedList: [],
    aiCount: 0,
    page: 1,
    hasMore: true,
    searchKeyword: '',
    isVip: false
  },

  async onLoad() {
    var app = getApp();
    if (app.globalData.isEnterprise) {
      wx.redirectTo({ url: '/pages/enterprise-home/enterprise-home' });
      return;
    }
    var sysInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight || 20,
      isVip: vip.isVip()
    });
    var request = require('../../utils/api').request;
    try {
      var tmpl = await request({ url: '/api/v1/pages/home', needAuth: false });
      if (tmpl && tmpl.config && tmpl.config.length > 0) {
        this.setData({ useDynamicPage: true });
        return;
      }
    } catch (e) {}
    this.loadBanners();
    this.loadQuickLinks();
    this.loadCategories();
    this.loadNotices();
    this.loadFeed();
  },

  async loadCategories() {
    try {
      var result = await catApi.getList();
      var list = Array.isArray(result) ? result : [];
      this.setData({ categories: [{ id: '', name: '推荐' }, ...list] });
    } catch (e) { console.error('loadCategories fail:', e); }
  },

  async loadQuickLinks() {
    try {
      var result = await quickLinkApi.getActive();
      var list = Array.isArray(result) ? result : [];
      if (list.length > 0) this.setData({ quickLinks: list.map(function (item) { return Object.assign({}, item, { icon: resolve(item.icon) }); }) });
    } catch (e) { console.error('loadQuickLinks fail:', e); }
  },

  async loadBanners() {
    try {
      var result = await bannerApi.getActive();
      var list = Array.isArray(result) ? result : (result.list || result.data || []);
      if (list.length > 0) this.setData({ banners: list.map(function (item) { return Object.assign({}, item, { image_url: resolve(item.image_url) }); }) });
    } catch (e) { console.error('loadBanners fail:', e); }
  },

  async loadNotices() {
    try {
      var result = await notifyApi.getActive();
      var list = Array.isArray(result) ? result : [];
      if (list.length > 0) this.setData({ notices: list });
    } catch (e) { console.error('loadNotices fail:', e); }
  },

  goNotifications: function () { wx.navigateTo({ url: '/pages/notifications/notifications' }); },

  onShow: function () {
    var app = getApp();
    if (app.globalData.isEnterprise) {
      wx.redirectTo({ url: '/pages/enterprise-home/enterprise-home' });
      return;
    }
    this.syncTabBar();
  },

  onPageScroll: function (e) {
    var threshold = 280;
    var navHeight = this.data.statusBarHeight + 44;
    this.setData({ catSticky: e.scrollTop > threshold, stickyStyle: e.scrollTop > threshold ? 'top: ' + navHeight + 'px' : '' });
  },

  onPullDownRefresh: function () {
    this.setData({ page: 1, hasMore: true, feedList: [] });
    this.loadFeed().finally(function () { wx.stopPullDownRefresh(); });
  },

  onReachBottom: function () {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.setData({ page: this.data.page + 1 });
      this.loadMore();
    }
  },

  _getUserData: function () {
    try {
      var info = wx.getStorageSync('userInfo');
      return info || null;
    } catch (e) { return null; }
  },

  loadFeed: async function () {
    this.setData({ skeleton: true });
    try {
      var userData = this._getUserData();
      var params = { page: 1, limit: 10, userData: userData };
      if (this.data.activeCategory) params.categoryId = this.data.activeCategory;
      var result = await feedStream.get(params);
      this.setData({ feedList: result.list, aiCount: result.aiCount, hasMore: result.hasMore });
    } catch (e) { console.error('loadFeed fail:', e); }
    finally { this.setData({ skeleton: false }); }
  },

  loadMore: async function () {
    if (this.data.loadingMore) return;
    this.setData({ loadingMore: true });
    try {
      var userData = this._getUserData();
      var params = { page: this.data.page, limit: 10, userData: userData };
      if (this.data.activeCategory) params.categoryId = this.data.activeCategory;
      if (this.data.searchKeyword) params.keyword = this.data.searchKeyword;
      var result = await feedStream.get(params);
      this.setData({ feedList: this.data.feedList.concat(result.list), hasMore: result.hasMore });
    } catch (e) { this.setData({ page: this.data.page - 1 }); }
    finally { this.setData({ loadingMore: false }); }
  },

  onCategoryTap: function (e) {
    var id = e.currentTarget.dataset.id;
    if (id === this.data.activeCategory) return;
    this.setData({ activeCategory: id, page: 1, feedList: [], searchKeyword: '' });
    this.loadFeed();
  },

  onQuickLinkTap: function (e) {
    var link = e.currentTarget.dataset.link;
    if (!link) return;
    if (link.indexOf('search') !== -1 || link.indexOf('keyword') !== -1) {
      var kw = link.split('=').pop();
      if (kw) { this.doSearch(kw); return; }
    }
    wx.navigateTo({ url: link });
  },

  onBannerChange: function (e) { this.setData({ bannerCurrent: e.detail.current }); },

  goSearch: function () {
    wx.navigateTo({ url: '/pages/search/search' });
  },

  onSearchInput: function (e) {
    this.setData({ searchKeyword: e.detail.value });
  },

  onSearchConfirm: function (e) {
    var keyword = (e.detail.value || '').trim();
    this.doSearch(keyword);
  },

  doSearch: function (keyword) {
    var that = this;
    if (!keyword) { that.loadFeed(); return; }
    that.setData({ searchKeyword: keyword, activeCategory: '', page: 1, feedList: [] });
    that.loadFeed();
  },

  clearSearch: function () {
    this.setData({ searchKeyword: '', page: 1, feedList: [] });
    this.loadFeed();
  },

  goDetail: function (e) {
    var id = e.detail && e.detail.id;
    if (!id) id = e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.id;
    if (id) {
      wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
    }
  },

  goCompany: function (e) {
    var id = e.detail && e.detail.id;
    if (id) wx.navigateTo({ url: '/pages/enterprise-detail/enterprise-detail?id=' + id });
  },

  goCreateResume: function () { wx.navigateTo({ url: '/pages/create-resume/create-resume' }); },

  goVip: function () {
    wx.navigateTo({ url: '/pages/vip/vip' });
  },

  goAiRecommend: function () {
    wx.switchTab({ url: '/pages/aiRecommend/aiRecommend' });
  },

  onAiAction: function (e) {
    if (e.detail && e.detail.action === 'chat') {
      var auth = require('../../services/core/auth');
      if (!auth.isLoggedIn()) {
        wx.navigateTo({ url: '/pages/login-phone/login-phone' });
        return;
      }
      wx.navigateTo({ url: '/pages/chat/chat' });
    }
  },

  onPostAction: function (e) {
    if (e.detail && e.detail.action === 'chat') {
      var auth = require('../../services/core/auth');
      if (!auth.isLoggedIn()) {
        wx.navigateTo({ url: '/pages/login-phone/login-phone' });
        return;
      }
      wx.navigateTo({ url: '/pages/chat/chat' });
    }
  },

  onFeedAction: function (e) {
    if (e.detail.action === 'chat') {
      var auth2 = require('../../services/core/auth');
      if (!auth2.isLoggedIn()) { wx.navigateTo({ url: '/pages/login-phone/login-phone' }); return; }
      wx.navigateTo({ url: '/pages/chat/chat' });
    }
  },

  syncTabBar: function () {
    var app = getApp();
    var tabBar = this.getTabBar();
    if (tabBar) { tabBar.setRole(app.globalData.isEnterprise ? 'enterprise' : 'user'); tabBar.setSelected(0); }
  }
});
