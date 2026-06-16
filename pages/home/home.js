const { job, ai, auth, feedEngine } = require('../../services/index');
const { banners: bannerApi, categories: catApi, notifications: notifyApi, quickLinks: quickLinkApi } = require('../../utils/api');
const { resolve } = require('../../utils/image');

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
    hasMore: true
  },

  async onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20 });
    const { request } = require('../../utils/api');
    try {
      const tmpl = await request({ url: '/api/v1/pages/home', needAuth: false });
      if (tmpl && tmpl.config && tmpl.config.length > 0) {
        this.setData({ useDynamicPage: true });
        return;
      }
    } catch {}
    this.loadBanners();
    this.loadQuickLinks();
    this.loadCategories();
    this.loadNotices();
    this.loadFeed();
  },

  async loadCategories() {
    try {
      const result = await catApi.getList();
      const list = Array.isArray(result) ? result : [];
      this.setData({ categories: [{ id: '', name: '推荐' }, ...list] });
    } catch (e) { console.error('加载分类失败:', e); }
  },

  async loadQuickLinks() {
    try {
      const result = await quickLinkApi.getActive();
      const list = Array.isArray(result) ? result : [];
      if (list.length > 0) {
        this.setData({ quickLinks: list.map(item => ({ ...item, icon: resolve(item.icon) })) });
      }
    } catch (e) { console.error('加载快捷图标失败:', e); }
  },

  async loadBanners() {
    try {
      const result = await bannerApi.getActive();
      const list = Array.isArray(result) ? result : (result.list || result.data || []);
      if (list.length > 0) {
        this.setData({ banners: list.map(item => ({ ...item, image_url: resolve(item.image_url) })) });
      }
    } catch (e) { console.error('加载轮播图失败:', e); }
  },

  async loadNotices() {
    try {
      const result = await notifyApi.getActive();
      const list = Array.isArray(result) ? result : [];
      if (list.length > 0) this.setData({ notices: list });
    } catch (e) { console.error('加载通知失败:', e); }
  },

  goNotifications() { wx.navigateTo({ url: '/pages/notifications/notifications' }); },

  onShow() { this.syncTabBar(); },

  onPageScroll(e) {
    const threshold = 280;
    const navHeight = this.data.statusBarHeight + 44;
    const stickyStyle = e.scrollTop > threshold ? `top: ${navHeight}px` : '';
    this.setData({ catSticky: e.scrollTop > threshold, stickyStyle });
  },

  onPullDownRefresh() {
    this.setData({ page: 1, hasMore: true, feedList: [] });
    this.loadFeed().finally(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.setData({ page: this.data.page + 1 });
      this.loadMore();
    }
  },

  async loadFeed() {
    this.setData({ skeleton: true });
    try {
      const params = { page: 1, limit: 10 };
      if (this.data.activeCategory) params.category_id = this.data.activeCategory;
      const [jobFeed, aiFeed] = await Promise.all([
        job.getJobFeed(params).catch(() => ({ list: [] })),
        auth.isLoggedIn() && !params.category_id ? ai.getRecommendationFeed().catch(() => ({ list: [] })) : Promise.resolve({ list: [] })
      ]);
      const merged = feedEngine.mergeFeed(jobFeed.list, aiFeed.list, []);
      this.setData({ feedList: merged, aiCount: aiFeed.list.length, hasMore: jobFeed.hasMore });
    } catch (e) { console.error('加载失败:', e); }
    finally { this.setData({ skeleton: false }); }
  },

  async loadMore() {
    this.setData({ loadingMore: true });
    try {
      const params = { page: this.data.page, limit: 10 };
      if (this.data.activeCategory) params.category_id = this.data.activeCategory;
      const feed = await job.getJobFeed(params);
      this.setData({ feedList: [...this.data.feedList, ...feed.list], hasMore: feed.hasMore });
    } catch (e) { this.setData({ page: this.data.page - 1 }); }
    finally { this.setData({ loadingMore: false }); }
  },

  onCategoryTap(e) {
    const id = e.currentTarget.dataset.id;
    if (id === this.data.activeCategory) return;
    this.setData({ activeCategory: id, page: 1, feedList: [] });
    this.loadFeed();
  },

  onQuickLinkTap(e) { const link = e.currentTarget.dataset.link; if (link) wx.navigateTo({ url: link }); },

  onBannerChange(e) { this.setData({ bannerCurrent: e.detail.current }); },

  goSearch() { wx.navigateTo({ url: '/pages/search/search' }); },

  goDetail(e) { const id = e.detail.id; if (id) wx.navigateTo({ url: `/pages/detail/detail?id=${id}` }); },

  goCompany(e) { const id = e.detail.id; if (id) wx.navigateTo({ url: `/pages/enterprise-detail/enterprise-detail?id=${id}` }); },

  goAiRecommend() { wx.switchTab({ url: '/pages/aiRecommend/aiRecommend' }); },

  onFeedAction(e) {
    if (e.detail.action === 'chat' && !auth.isLoggedIn()) {
      wx.navigateTo({ url: '/pages/login-phone/login-phone' });
    }
  },

  onPostAction(e) { console.log('post action:', e.detail.action); },

  onAiAction(e) {
    if (e.detail.action === 'apply') {
      if (!auth.isLoggedIn()) { wx.navigateTo({ url: '/pages/login-phone/login-phone' }); return; }
      wx.showToast({ title: '已表达兴趣', icon: 'success' });
    }
  },

  syncTabBar() {
    const app = getApp();
    const tabBar = this.getTabBar();
    if (tabBar) { tabBar.setRole(app.globalData.isEnterprise ? 'enterprise' : 'user'); tabBar.setSelected(0); }
  }
});
