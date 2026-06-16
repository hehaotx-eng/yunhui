var api = require('../../utils/api');

Page({
  data: {
    statusBarHeight: 0,
    loading: true,
    keyword: '',
    list: [],
    showEmpty: false
  },

  onLoad() {
    var sys = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: sys.statusBarHeight || 20 });
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  loadData: function() {
    var that = this;
    that.setData({ loading: true });
    var url = '/api/v1/enterprise/candidates';
    if (that.data.keyword) {
      url = url + '?keyword=' + encodeURIComponent(that.data.keyword);
    }
    api.request({ url: url }).then(function(list) {
      that.setData({ list: list, showEmpty: list.length === 0, loading: false });
    }).catch(function(e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
      that.setData({ loading: false });
    });
  },

  onKeywordInput: function(e) {
    this.setData({ keyword: e.detail.value });
  },

  onSearch: function() {
    this.loadData();
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
