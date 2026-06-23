var api = require('../../utils/api');
var { resolve } = require('../../utils/image');
var cached = require('../../utils/cached-request');

Page({
  data: {
    loading: true,
    loadingMore: false,
    keyword: '',
    list: [],
    page: 1,
    total: 0,
    hasMore: false,
    showEmpty: false
  },

  onLoad() {
    this.loadData(true);
  },

  onShow() {
    if (this.data.list.length === 0) {
      this.loadData(true);
    }
  },

  loadData: function(reset) {
    var that = this;
    var page = reset ? 1 : that.data.page + 1;
    if (reset) {
      that.setData({ loading: true, loadingMore: false });
    } else {
      that.setData({ loadingMore: true });
    }
    var url = '/api/v1/enterprise/candidates?page=' + page + '&limit=20';
    if (that.data.keyword) {
      url += '&keyword=' + encodeURIComponent(that.data.keyword);
    }

    // 第一页走缓存，翻页不缓存
    var fetch = page === 1
      ? cached.cachedGet(url, {}, {
          ttl: 3 * 60 * 1000,
          onUpdate: function(data) { that._processData(data, reset, page); }
        })
      : api.request({ url: url });

    fetch.then(function(data) {
      that._processData(data, reset, page);
    }).catch(function(e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
      that.setData({ loading: false, loadingMore: false });
    });
  },

  _processData: function(data, reset, page) {
    var rawList = data.list || [];
    var list = rawList.map(function(item) {
      return Object.assign({}, item, { avatar: item.avatar ? resolve(item.avatar) : '' });
    });
    var newList = reset ? list : this.data.list.concat(list);
    this.setData({
      list: newList,
      total: data.total || 0,
      page: data.page || page,
      hasMore: (data.page || page) * 20 < (data.total || 0),
      showEmpty: newList.length === 0,
      loading: false,
      loadingMore: false
    });
  },

  onPullDownRefresh: function() {
    cached.bust('/api/v1/enterprise/candidates');
    this.loadData(true);
    wx.stopPullDownRefresh();
  },

  onKeywordInput: function(e) {
    this.setData({ keyword: e.detail.value });
    if (this._searchTimer) clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => {
      this.loadData(true);
    }, 300);
  },

  onSearch: function() {
    if (this._searchTimer) clearTimeout(this._searchTimer);
    this.loadData(true);
  },

  onScrollToLower: function() {
    if (this.data.loadingMore || !this.data.hasMore) return;
    this.loadData(false);
  },

  viewResume: function(e) {
    var resumeId = e.currentTarget.dataset.resumeid;
    if (!resumeId) {
      wx.showToast({ title: '该用户暂无简历', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/resume-preview/resume-preview?id=' + resumeId + '&from=enterprise' });
  },

  onShareAppMessage() {
    return { title: '候选人管理', path: '/pages/candidates/candidates' };
  },

  onShareTimeline() {
    return { title: '候选人管理' };
  }
});
