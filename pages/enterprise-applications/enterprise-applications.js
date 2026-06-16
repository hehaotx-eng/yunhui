var api = require('../../utils/api');

Page({
  data: {
    statusBarHeight: 0,
    loading: true,
    activeFilter: 'all',
    filters: [
      { id: 'all', name: '全部' },
      { id: 'pending', name: '待处理' },
      { id: 'viewed', name: '已查看' },
      { id: 'accepted', name: '已通过' },
      { id: 'rejected', name: '已拒绝' }
    ],
    allList: [],
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
    api.request({ url: '/api/v1/enterprise/applications' }).then(function(list) {
      that.setData({ allList: list });
      that.filterList();
    }).catch(function(e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
    }).finally(function() {
      that.setData({ loading: false });
    });
  },

  filterList: function() {
    var active = this.data.activeFilter;
    var all = this.data.allList;
    var filtered = all;
    if (active !== 'all') {
      filtered = [];
      for (var i = 0; i < all.length; i++) {
        if (all[i].status === active) {
          filtered.push(all[i]);
        }
      }
    }
    this.setData({ list: filtered, showEmpty: filtered.length === 0 });
  },

  switchFilter: function(e) {
    this.setData({ activeFilter: e.currentTarget.dataset.filter });
    this.filterList();
  },

  goBack: function() {
    wx.navigateBack();
  },

  viewResume: function(e) {
    var resumeId = e.currentTarget.dataset.resumeid;
    if (!resumeId) {
      wx.showToast({ title: '该用户暂无简历', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/resume-preview/resume-preview?id=' + resumeId + '&from=enterprise' });
  },

  onChangeStatus: function(e) {
    var that = this;
    var id = e.currentTarget.dataset.id;
    var current = e.currentTarget.dataset.status;
    var actions = [];
    var maps = [];
    if (current !== 'viewed') { actions.push('标记为已查看'); maps.push('viewed'); }
    if (current !== 'accepted') { actions.push('标记为已通过'); maps.push('accepted'); }
    if (current !== 'rejected') { actions.push('标记为未通过'); maps.push('rejected'); }
    wx.showActionSheet({
      itemList: actions,
      success: function(res) {
        var status = maps[res.tapIndex];
        api.applications.updateStatus(id, status).then(function() {
          wx.showToast({ title: '状态已更新', icon: 'success' });
          that.loadData();
        }).catch(function(e) {
          wx.showToast({ title: e.message || '操作失败', icon: 'none' });
        });
      }
    });
  }
});
