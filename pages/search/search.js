var feedStream = require('../../services/core/feedStream');
var vip = require('../../services/core/vip');

var HISTORY_KEY = 'search_history';

Page({
  data: {
    keyword: '',
    hotKeywords: ['前端开发', '产品经理', 'Java开发', 'UI设计', '运营', '数据分析', 'Python', '人工智能'],
    historyKeywords: [],
    exactResults: [],
    recommendResults: [],
    showResults: false,
    loading: false
  },

  onLoad: function () {
    this.loadHistory();
  },

  loadHistory: function () {
    var history = wx.getStorageSync(HISTORY_KEY) || [];
    this.setData({ historyKeywords: history.slice(0, 10) });
  },

  saveHistory: function (keyword) {
    var history = wx.getStorageSync(HISTORY_KEY) || [];
    history = history.filter(function (k) { return k !== keyword; });
    history.unshift(keyword);
    history = history.slice(0, 20);
    wx.setStorageSync(HISTORY_KEY, history);
    this.setData({ historyKeywords: history.slice(0, 10) });
  },

  onInput: function (e) {
    var value = e.detail.value;
    this.setData({ keyword: value });
    if (!value) {
      this.setData({ showResults: false, exactResults: [], recommendResults: [] });
      if (this._searchTimer) clearTimeout(this._searchTimer);
      return;
    }
    if (value.length < 2) return;
    if (this._searchTimer) clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(function () {
      this.doSearch(value);
    }.bind(this), 300);
  },

  clearKeyword: function () {
    this.setData({ keyword: '', showResults: false, exactResults: [], recommendResults: [] });
  },

  onConfirm: function () { this.doSearch(this.data.keyword); },

  selectKeyword: function (e) {
    var keyword = e.currentTarget.dataset.keyword;
    this.setData({ keyword: keyword });
    this.doSearch(keyword);
  },

  _getUserData: function () {
    try {
      var info = wx.getStorageSync('userInfo');
      return info || null;
    } catch (e) { return null; }
  },

  doSearch: async function (kw) {
    var keyword = (kw || this.data.keyword).trim();
    if (!keyword) return;
    if (!kw) this.saveHistory(keyword);
    this.setData({ loading: true, showResults: true });
    try {
      var userData = this._getUserData();
      var isVip = vip.isVip();
      var result = await feedStream.get({ keyword: keyword, page: 1, limit: 20, userData: userData, excludeVip: !isVip });
      var list = result.list || [];
      this.setData({ exactResults: list.slice(0, 10), recommendResults: list.slice(10, 20) });
    } catch (e) {
      console.error('search fail:', e);
      this.setData({ exactResults: [], recommendResults: [] });
    } finally {
      this.setData({ loading: false });
    }
  },

  goDetail: function (e) {
    var id = e.detail && e.detail.id;
    if (id) wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
  },

  clearHistory: function () {
    var that = this;
    wx.showModal({
      title: '确认清除',
      content: '确定要清除搜索历史吗？',
      success: function (res) {
        if (res.confirm) {
          wx.removeStorageSync(HISTORY_KEY);
          that.setData({ historyKeywords: [] });
          wx.showToast({ title: '已清除', icon: 'success' });
        }
      }
    });
  },

  goBack: function () { wx.navigateBack(); },

  onShareAppMessage() {
    return { title: '搜索职位 - 发现好工作', path: '/pages/search/search' };
  },

  onShareTimeline() {
    return { title: '搜索职位 - 发现好工作' };
  }
});
