var feedStream = require('../../services/core/feedStream');
var { banners: bannerApi, categories: catApi, notifications: notifyApi, quickLinks: quickLinkApi } = require('../../utils/api');
var { resolve } = require('../../utils/image');
var vip = require('../../services/core/vip');
var cached = require('../../utils/cached-request');

Page({
  data: {
    statusBarHeight: 0,
    useDynamicPage: false,
    skeleton: true,
    loading: false,
    loadingMore: false,
    activeCategory: '',
    categories: [{ id: '', name: '全部' }, { id: 'daily', name: '日结' }, { id: 'parttime', name: '兼职' }, { id: 'fulltime', name: '全职' }, { id: 'intern', name: '实习' }],
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
    isVip: false,
    isLoggedIn: false,
    showFilter: false,
    filter: { area: '', salary: '', benefits: {} },
    filterOptions: {
      areas: ['不限', '和平区', '沈河区', '皇姑区', '大东区', '铁西区', '浑南区', '于洪区', '沈北新区', '苏家屯区', '辽中区', '新民市', '法库县', '康平县', '其他城市'],
      salaries: ['不限', '2k以下', '2k-5k', '5k-8k', '8k-12k', '12k-20k', '20k以上'],
      benefits: ['五险一金', '双休', '包吃', '包住', '餐补', '交通补助', '带薪年假', '年终奖', '节日福利', '定期团建']
    }
  },

  async onLoad() {
    var app = getApp();
    if (app.globalData.isEnterprise) {
      wx.redirectTo({ url: '/pages/enterprise-home/enterprise-home' });
      return;
    }
    var sysInfo = wx.getSystemInfoSync();
    var token = wx.getStorageSync('token');
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight || 20,
      isVip: vip.isVip(),
      isLoggedIn: !!token
    });

    // 检查是否使用动态页面
    try {
      var tmpl = await cached.cachedGet('/api/v1/pages/home', {}, { needAuth: false });
      if (tmpl && tmpl.config && tmpl.config.length > 0) {
        this.setData({ useDynamicPage: true });
        return;
      }
    } catch (e) {}

    // 静默加载：有缓存秒出，无缓存等待
    this._loadAllStatic();
    this.loadFeed();
  },

  // 并行加载静态数据（带缓存）
  _loadAllStatic: function() {
    var that = this;
    // 这些数据走 SWR 缓存，5分钟内不重复请求
    Promise.all([
      cached.cachedGet('/api/v1/banners', {}, {
        ttl: 10 * 60 * 1000, needAuth: false,
        onUpdate: function(data) {
          var list = Array.isArray(data) ? data : (data.list || data.data || []);
          if (list.length > 0) that.setData({ banners: list.map(function(item) { return Object.assign({}, item, { image_url: resolve(item.image_url) }); }) });
        }
      }),
      cached.cachedGet('/api/v1/quick-links', {}, {
        ttl: 10 * 60 * 1000, needAuth: false,
        onUpdate: function(data) {
          var list = Array.isArray(data) ? data : [];
          if (list.length > 0) that.setData({ quickLinks: list.map(function(item) { return Object.assign({}, item, { icon: resolve(item.icon) }); }) });
        }
      }),
      cached.cachedGet('/api/v1/notifications', {}, {
        ttl: 5 * 60 * 1000, needAuth: false,
        onUpdate: function(data) {
          var list = Array.isArray(data) ? data : [];
          that.setData({ notices: list });
        }
      })
    ]).then(function(results) {
      var bannerData = results[0] || [];
      var bannerList = Array.isArray(bannerData) ? bannerData : (bannerData.list || bannerData.data || []);
      var linkData = results[1] || [];
      var linkList = Array.isArray(linkData) ? linkData : [];
      var noticeData = results[2] || [];
      var noticeList = Array.isArray(noticeData) ? noticeData : [];

      that.setData({
        banners: bannerList.length > 0 ? bannerList.map(function(item) { return Object.assign({}, item, { image_url: resolve(item.image_url) }); }) : that.data.banners,
        quickLinks: linkList.length > 0 ? linkList.map(function(item) { return Object.assign({}, item, { icon: resolve(item.icon) }); }) : that.data.quickLinks,
        notices: noticeList.length > 0 ? noticeList : that.data.notices
      });
    }).catch(function(e) { console.error('loadStatic fail:', e); });
  },

  goNotifications: function () { wx.navigateTo({ url: '/pages/notifications/notifications' }); },

  onShow: function () {
    var app = getApp();
    if (app.globalData.isEnterprise) {
      wx.redirectTo({ url: '/pages/enterprise-home/enterprise-home' });
      return;
    }
    var token = wx.getStorageSync('token');
    this.setData({ isLoggedIn: !!token });
    this.syncTabBar();
  },

  onPageScroll: function (e) {
    var threshold = 280;
    var navHeight = this.data.statusBarHeight + 44;
    this.setData({ catSticky: e.scrollTop > threshold, stickyStyle: e.scrollTop > threshold ? 'top: ' + (navHeight - 1) + 'px' : '' });
  },

  onPullDownRefresh: function () {
    // 下拉刷新：清除首页相关缓存，强制重新请求
    cached.bust('/api/v1/banners');
    cached.bust('/api/v1/quick-links');
    cached.bust('/api/v1/categories');
    cached.bust('/api/v1/notifications');
    this.setData({ page: 1, hasMore: true, feedList: [] });
    this._loadAllStatic();
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
      var token = wx.getStorageSync('token');
      var isVip = vip.isVip();
      var params = { page: 1, limit: 10, userData: userData };
      if (this.data.activeCategory) params.jobType = this.data.activeCategory;
      if (!isVip) params.excludeVip = true;
      var filter = this.data.filter;
      if (filter.area) params.location = filter.area;
      if (filter.salary) params.salaryRange = filter.salary;
      if (filter.benefits) {
        var benefitList = [];
        for (var bk in filter.benefits) { if (filter.benefits[bk]) benefitList.push(bk); }
        if (benefitList.length > 0) params.benefits = benefitList.join(',');
      }
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
      var token = wx.getStorageSync('token');
      var isVip = vip.isVip();
      var params = { page: this.data.page, limit: 10, userData: userData };
      if (this.data.activeCategory) params.jobType = this.data.activeCategory;
      if (this.data.searchKeyword) params.keyword = this.data.searchKeyword;
      if (!isVip) params.excludeVip = true;
      var filter = this.data.filter;
      if (filter.area) params.location = filter.area;
      if (filter.salary) params.salaryRange = filter.salary;
      if (filter.benefits) {
        var benefitList = [];
        for (var bk in filter.benefits) { if (filter.benefits[bk]) benefitList.push(bk); }
        if (benefitList.length > 0) params.benefits = benefitList.join(',');
      }
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

  onFilterTap: function () {
    this.setData({ showFilter: true, 'filter.benefits': {} });
  },

  closeFilter: function () {
    this.setData({ showFilter: false });
  },

  setFilter: function (e) {
    var key = e.currentTarget.dataset.key;
    var value = e.currentTarget.dataset.value;
    if (value === '不限') value = '';
    this.setData({ ['filter.' + key]: value });
  },

  toggleBenefit: function (e) {
    var value = e.currentTarget.dataset.value;
    var benefits = this.data.filter.benefits;
    var key = 'filter.benefits.' + value;
    this.setData({ [key]: !benefits[value] });
  },

  resetFilter: function () {
    this.setData({ filter: { area: '', salary: '', benefits: {} } });
  },

  applyFilter: function () {
    this.setData({ showFilter: false, page: 1, feedList: [] });
    this.loadFeed();
  },

  goLogin: function () {
    wx.navigateTo({ url: '/pages/login/login' });
  },

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
        wx.navigateTo({ url: '/pages/login/login' });
        return;
      }
      wx.navigateTo({ url: '/pages/chat/chat' });
    }
  },

  onPostAction: function (e) {
    if (e.detail && e.detail.action === 'chat') {
      var auth = require('../../services/core/auth');
      if (!auth.isLoggedIn()) {
        wx.navigateTo({ url: '/pages/login/login' });
        return;
      }
      wx.navigateTo({ url: '/pages/chat/chat' });
    }
  },

  onFeedAction: function (e) {
    if (e.detail.action === 'chat') {
      var auth2 = require('../../services/core/auth');
      if (!auth2.isLoggedIn()) { wx.navigateTo({ url: '/pages/login/login' }); return; }
      wx.navigateTo({ url: '/pages/chat/chat' });
    }
  },

  syncTabBar: function () {
    var app = getApp();
    var tabBar = this.getTabBar();
    if (tabBar) { tabBar.setRole(app.globalData.isEnterprise ? 'enterprise' : 'user'); tabBar.setSelected(0); }
  },

  onShareAppMessage() {
    return { title: '发现好工作 - 海量职位等你来', path: '/pages/home/home' };
  },

  onShareTimeline() {
    return { title: '发现好工作 - 海量职位等你来' };
  }
});
