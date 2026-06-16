const { job, auth, chat, enterprise } = require('../../services/index');
const { resolve } = require('../../utils/image');

Page({
  data: {
    statusBarHeight: 0,
    id: '',
    detail: null,
    companyJobs: [],
    skeleton: true,
    isFavorite: false
  },

  onLoad(options) {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20, id: options.id });
    this.loadDetail();
  },

  onPullDownRefresh() {
    this.loadDetail().finally(() => wx.stopPullDownRefresh());
  },

  onShareAppMessage() {
    const { detail } = this.data;
    return {
      title: detail ? `${detail.title} - ${detail.enterprise_name || ''}` : '发现好机会',
      path: `/pages/detail/detail?id=${this.data.id}`
    };
  },

  async loadDetail() {
    if (!this.data.id) return;
    this.setData({ skeleton: true });
    try {
      const detail = await job.getJobDetail(this.data.id);
      if (detail.company_logo) detail.company_logo = resolve(detail.company_logo);
      this.setData({ detail });
      if (detail.company_id) {
        this.loadCompanyJobs(detail.company_id);
      }
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ skeleton: false });
    }
  },

  async loadCompanyJobs(companyId) {
    try {
      const info = await enterprise.getCompanyDetail(companyId);
      if (info && info.jobs) {
        this.setData({ companyJobs: info.jobs.slice(0, 5) });
      }
    } catch (e) {}
  },

  goBack() {
    wx.navigateBack();
  },

  goCompany(e) {
    const id = e.currentTarget.dataset.id;
    if (id) wx.navigateTo({ url: `/pages/enterprise-detail/enterprise-detail?id=${id}` });
  },

  goRelated(e) {
    const id = e.currentTarget.dataset.id || e.detail?.id;
    if (id) wx.redirectTo({ url: `/pages/detail/detail?id=${id}` });
  },

  onFavorite() {
    this.setData({ isFavorite: !this.data.isFavorite });
    wx.showToast({ title: this.data.isFavorite ? '已收藏' : '已取消', icon: 'none' });
  },

  onShare() {},

  async onChat() {
    if (!auth.isLoggedIn()) {
      wx.navigateTo({ url: '/pages/login-phone/login-phone' });
      return;
    }
    const { detail } = this.data;
    if (!detail || !detail.enterprise_id) return;
    try {
      const conv = await chat.startChat(detail.enterprise_id);
      wx.navigateTo({ url: `/pages/chat/chat?conversationId=${conv.id}` });
    } catch (e) {
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  async onApply() {
    if (!auth.isLoggedIn()) {
      wx.navigateTo({ url: '/pages/login-phone/login-phone' });
      return;
    }
    try {
      await job.applyToJob(this.data.id);
      wx.showToast({ title: '已表达兴趣', icon: 'success' });
    } catch (e) {
      wx.showToast({ title: e.message || '操作失败', icon: 'none' });
    }
  }
});
