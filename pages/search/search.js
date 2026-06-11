const { jobs, search } = require('../../utils/api.js');

Page({
  data: {
    keyword: '',
    hotKeywords: [],
    historyKeywords: [],
    searchResults: [],
    showResults: false,
    loading: false
  },

  onLoad() {
    this.loadHotKeywords();
    this.loadHistory();
  },

  async loadHotKeywords() {
    try {
      const data = await search.getHot();
      const list = data && data.data ? data.data : (data || []);
      this.setData({ hotKeywords: list.slice(0, 10) });
    } catch (error) {
      console.error('加载热门搜索失败:', error);
      this.setData({ hotKeywords: ['前端开发', '产品经理', 'Java开发', 'UI设计', '运营'] });
    }
  },

  async loadHistory() {
    try {
      const data = await search.getHistory();
      const list = data && data.data ? data.data : (data || []);
      this.setData({ historyKeywords: list.slice(0, 10) });
    } catch (error) {
      console.error('加载搜索历史失败:', error);
      this.setData({ historyKeywords: [] });
    }
  },

  onInput(e) {
    this.setData({ keyword: e.detail.value, showResults: false });
  },

  async onSearch() {
    const keyword = this.data.keyword.trim();
    if (!keyword) return;
    
    this.setData({ loading: true, showResults: true });
    try {
      const result = await jobs.getAll({ keyword, limit: 20 });
      const list = result && result.data ? result.data : (result || []);
      this.setData({ searchResults: list });
    } catch (error) {
      console.error('搜索失败:', error);
      this.setData({ searchResults: [] });
    } finally {
      this.setData({ loading: false });
    }
  },

  onConfirm(e) {
    this.setData({ keyword: e.detail.value });
    this.onSearch();
  },

  selectKeyword(e) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData({ keyword });
    this.onSearch();
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },

  clearHistory() {
    wx.showModal({
      title: '确认清除',
      content: '确定要清除搜索历史吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await search.clearHistory();
            this.setData({ historyKeywords: [] });
            wx.showToast({ title: '清除成功', icon: 'success' });
          } catch (error) {
            console.error('清除历史失败:', error);
          }
        }
      }
    });
  },

  goBack() {
    wx.navigateBack();
  }
});