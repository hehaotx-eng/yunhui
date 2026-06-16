const { request } = require('../../utils/api');
const { resolve } = require('../../utils/image');

const FALLBACK_CONFIG = [
  { type: 'search_bar', props: { placeholder: '搜索职位、企业、技能...' } },
  { type: 'banner', props: { interval: 4000, source: 'api', images: [] } },
  { type: 'quick_links', props: {} },
  { type: 'notice_bar', props: { icon: '' } },
  { type: 'category_tabs', props: {} },
  { type: 'ai_banner', props: { title: '发现适合你的机会', desc: '基于你的偏好智能匹配' } },
  { type: 'job_list', props: { title: '最新职位', limit: 10 } }
];

Component({
  properties: {
    pagePath: { type: String, value: '', observer: 'onPagePathChange' },
    config: { type: Array, value: [], observer: 'onConfigChange' }
  },

  data: {
    phase: 'loading',
    widgets: [],
    errorMsg: '',
    quickLinks: [],
    banners: [],
    notices: [],
    activeCategory: '',
    categories: [{ id: '', name: '推荐' }],
    feedList: [],
    companyPosts: [],
    skeleton: true
  },

  lifetimes: {
    attached() {
      console.log('[dynamic-page] attached, pagePath:', this.properties.pagePath);
      if (this.properties.pagePath) this.loadPageConfig();
    }
  },

  methods: {
    onPagePathChange(newPath) {
      console.log('[dynamic-page] pagePath changed:', newPath);
      if (newPath) this.loadPageConfig();
    },

    onConfigChange(config) {
      console.log('[dynamic-page] config changed, length:', config ? config.length : 0);
      if (config && config.length > 0) {
        this.setData({ widgets: config, phase: 'ready' });
        this.initWidgets(config);
      }
    },

    async loadPageConfig() {
      const path = this.properties.pagePath;
      console.log('[dynamic-page] loadPageConfig start, path:', path);

      if (!path) {
        console.warn('[dynamic-page] no pagePath, using fallback');
        this.setData({ widgets: FALLBACK_CONFIG, phase: 'ready', errorMsg: '' });
        this.initWidgets(FALLBACK_CONFIG);
        return;
      }

      this.setData({ phase: 'loading', errorMsg: '' });
      try {
        const res = await request({
          url: `/api/v1/pages/${path}`,
          needAuth: false
        });
        console.log('[dynamic-page] API response:', JSON.stringify(res));

        const config = res?.config || [];
        if (config.length > 0) {
          console.log('[dynamic-page] got', config.length, 'widgets from API');
          this.setData({ widgets: config, phase: 'ready' });
          this.initWidgets(config);
        } else {
          console.log('[dynamic-page] empty config from API, using fallback');
          this.setData({ widgets: FALLBACK_CONFIG, phase: 'ready' });
          this.initWidgets(FALLBACK_CONFIG);
        }
      } catch (e) {
        console.error('[dynamic-page] load failed:', e);
        console.log('[dynamic-page] falling back to default config');
        this.setData({
          widgets: FALLBACK_CONFIG,
          phase: 'ready',
          errorMsg: '网络异常，显示默认内容'
        });
        this.initWidgets(FALLBACK_CONFIG);
      }
    },

    initWidgets(config) {
      console.log('[dynamic-page] initWidgets, types:', config.map(w => w.type).join(', '));
      const needs = { banner: false, quick_links: false, notice_bar: false, category_tabs: false, job_list: false, company_posts: false };
      config.forEach(w => { if (needs.hasOwnProperty(w.type)) needs[w.type] = true; });
      if (needs.banner) this.loadBanners();
      if (needs.quick_links) this.loadQuickLinks();
      if (needs.notice_bar) this.loadNotices();
      if (needs.category_tabs) this.loadCategories();
      if (needs.job_list) this.loadJobs();
      if (needs.company_posts) this.loadCompanyPosts();
    },

    async loadBanners() {
      const { banners: bannerApi } = require('../../utils/api');
      try {
        const result = await bannerApi.getActive();
        const list = Array.isArray(result) ? result : (result.list || result.data || []);
        this.setData({ banners: list.map(item => ({ ...item, image_url: resolve(item.image_url) })) });
        console.log('[dynamic-page] banners loaded:', list.length);
      } catch (e) { console.error('[dynamic-page] loadBanners failed:', e); }
    },

    async loadQuickLinks() {
      const { quickLinks: quickLinkApi } = require('../../utils/api');
      try {
        const result = await quickLinkApi.getActive();
        const list = Array.isArray(result) ? result : [];
        this.setData({ quickLinks: list.map(item => ({ ...item, icon: resolve(item.icon) })) });
        console.log('[dynamic-page] quickLinks loaded:', list.length);
      } catch (e) { console.error('[dynamic-page] loadQuickLinks failed:', e); }
    },

    async loadNotices() {
      const { notifications: notifyApi } = require('../../utils/api');
      try {
        const result = await notifyApi.getActive();
        const list = Array.isArray(result) ? result : [];
        this.setData({ notices: list });
        console.log('[dynamic-page] notices loaded:', list.length);
      } catch (e) { console.error('[dynamic-page] loadNotices failed:', e); }
    },

    async loadCategories() {
      const { categories: catApi } = require('../../utils/api');
      try {
        const result = await catApi.getList();
        const list = Array.isArray(result) ? result : [];
        this.setData({ categories: [{ id: '', name: '推荐' }, ...list] });
        console.log('[dynamic-page] categories loaded:', list.length);
      } catch (e) { console.error('[dynamic-page] loadCategories failed:', e); }
    },

    async loadJobs() {
      try {
        const { job } = require('../../services/index');
        const feed = await job.getJobFeed({ page: 1, limit: 10 });
        this.setData({ feedList: feed.list || [], skeleton: false });
        console.log('[dynamic-page] jobs loaded:', (feed.list || []).length);
      } catch (e) {
        console.error('[dynamic-page] loadJobs failed:', e);
        this.setData({ skeleton: false });
      }
    },

    async loadCompanyPosts() {
      const { request } = require('../../utils/api');
      try {
        const res = await request({ url: '/api/v1/company-posts', needAuth: false });
        const list = Array.isArray(res) ? res : (res?.list || []);
        this.setData({ companyPosts: list });
        console.log('[dynamic-page] companyPosts loaded:', list.length);
      } catch (e) { console.error('[dynamic-page] loadCompanyPosts failed:', e); }
    },

    onSearchTap() { wx.navigateTo({ url: '/pages/search/search' }); },
    onBannerChange(e) { this.triggerEvent('bannerchange', { current: e.detail.current }); },
    onCategoryTap(e) { this.setData({ activeCategory: e.currentTarget.dataset.id }); this.triggerEvent('categorytap', { id: e.currentTarget.dataset.id }); },
    onJobTap(e) { const id = e.currentTarget.dataset.id; const jobId = id || e.currentTarget.dataset.jobId; if (jobId) wx.navigateTo({ url: `/pages/detail/detail?id=${jobId}` }); },
    onQuickLinkTap(e) {
      const link = e.currentTarget.dataset.link;
      console.log('[dynamic-page] quickLink tap, link:', link);
      if (!link) { console.warn('[dynamic-page] quickLink has no link field'); return; }
      if (!link.startsWith('/')) { console.warn('[dynamic-page] link must start with /'); return; }
      wx.navigateTo({ url: link, fail: (err) => console.error('[dynamic-page] navigate failed:', err) });
    },
    onNoticeTap() { wx.navigateTo({ url: '/pages/notifications/notifications' }); },
    onCustomBlockTap(e) { const link = e.currentTarget.dataset.link; if (link) wx.navigateTo({ url: link }); },
    onPostDetail(e) { const id = e.currentTarget.dataset.id; if (id) wx.navigateTo({ url: `/pages/notifications/notifications?id=${id}` }); }
  }
});
