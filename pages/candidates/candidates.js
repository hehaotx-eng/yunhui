var api = require('../../utils/api');

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
    api.request({ url: url }).then(function(data) {
      var list = data.list || [];
      var newList = reset ? list : that.data.list.concat(list);
      that.setData({
        list: newList,
        total: data.total || 0,
        page: data.page || page,
        hasMore: (data.page || page) * 20 < (data.total || 0),
        showEmpty: newList.length === 0,
        loading: false,
        loadingMore: false
      });
    }).catch(function(e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
      that.setData({ loading: false, loadingMore: false });
    });
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
  }
});
