const { job } = require('../../services/index');

const HISTORY_KEY = 'search_history';

Page({
  data: {
    statusBarHeight: 0,
    keyword: '',
    hotKeywords: ['前端开发', '产品经理', 'Java开发', 'UI设计', '运营', '数据分析', 'Python', '人工智能'],
    historyKeywords: [],
    exactResults: [],
    recommendResults: [],
    showResults: false,
    loading: false
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20 });
    this.loadHistory();
  },

  loadHistory() {
    const history = wx.getStorageSync(HISTORY_KEY) || [];
    this.setData({ historyKeywords: history.slice(0, 10) });
  },

  saveHistory(keyword) {
    let history = wx.getStorageSync(HISTORY_KEY) || [];
    history = history.filter(k => k !== keyword);
    history.unshift(keyword);
    history = history.slice(0, 20);
    wx.setStorageSync(HISTORY_KEY, history);
    this.setData({ historyKeywords: history.slice(0, 10) });
  },

  onInput(e) {
    const value = e.detail.value;
    this.setData({ keyword: value });

    if (!value) {
      this.setData({ showResults: false, exactResults: [], recommendResults: [] });
      if (this._searchTimer) clearTimeout(this._searchTimer);
      return;
    }

    if (value.length < 2) return;

    if (this._searchTimer) clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => {
      this.doSearch(value);
    }, 300);
  },

  onConfirm() {
    this.doSearch(this.data.keyword);
  },

  selectKeyword(e) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData({ keyword });
    this.doSearch(keyword);
  },

  async doSearch(kw) {
    const keyword = (kw || this.data.keyword).trim();
    if (!keyword) return;

    if (!kw) this.saveHistory(keyword);

    this.setData({ loading: true, showResults: true });

    try {
      const [exactRes, recommendRes] = await Promise.all([
        job.searchJobs({ keyword, page: 1, limit: 10 }),
        job.recommendJobs({ keyword, page: 1, limit: 10 })
      ]);

      const exactIds = new Set(exactRes.list.map(j => j.job_id || j.id));
      const recommendList = recommendRes.list.filter(j => !exactIds.has(j.job_id || j.id));

      this.setData({
        exactResults: exactRes.list,
        recommendResults: recommendList
      });
    } catch (e) {
      console.error('搜索失败:', e);
      this.setData({ exactResults: [], recommendResults: [] });
    } finally {
      this.setData({ loading: false });
    }
  },

  goDetail(e) {
    const id = e.detail.id;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },

  clearHistory() {
    wx.showModal({
      title: '确认清除',
      content: '确定要清除搜索历史吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync(HISTORY_KEY);
          this.setData({ historyKeywords: [] });
          wx.showToast({ title: '已清除', icon: 'success' });
        }
      }
    });
  },

  goBack() {
    wx.navigateBack();
  }
});
