var api = require('../../utils/api');

Page({
  data: {
    loading: true,
    list: [],
    showEmpty: false
  },

  onLoad() {
    this.loadData();
  },

  loadData() {
    var that = this;
    that.setData({ loading: true });
    api.request({ url: '/api/v1/enterprise/favorites' }).then(function(data) {
      var list = data.list || [];
      that.setData({ list: list, showEmpty: list.length === 0, loading: false });
    }).catch(function(e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
      that.setData({ loading: false });
    });
  },

  viewResume(e) {
    var resumeId = e.currentTarget.dataset.resumeid;
    if (!resumeId) return;
    wx.navigateTo({ url: '/pages/resume-preview/resume-preview?id=' + resumeId + '&from=enterprise' });
  },

  goBack() {
    wx.navigateBack();
  },

  onShareAppMessage() {
    return { title: '企业收藏', path: '/pages/enterprise-favorites/enterprise-favorites' };
  },

  onShareTimeline() {
    return { title: '企业收藏' };
  }
});