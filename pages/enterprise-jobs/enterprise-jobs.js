var api = require('../../utils/api');

Page({
  data: {
    statusBarHeight: 0,
    activeTab: 'all',
    tabs: [
      { id: 'all', name: '全部' },
      { id: 'online', name: '在线' },
      { id: 'offline', name: '下线' },
      { id: 'draft', name: '草稿' }
    ],
    allJobs: [],
    jobs: [],
    showEmpty: false,
    loading: false
  },

  onLoad() {
    var sys = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: sys.statusBarHeight || 20 });
    this.loadJobs();
  },

  onShow() {
    this.loadJobs();
  },

  loadJobs: function() {
    var that = this;
    that.setData({ loading: true });
    api.jobs.getMyList().then(function(result) {
      var list = Array.isArray(result) ? result : (result.list || result.rows || []);
      that.setData({ allJobs: list });
      that.filterJobs();
    }).catch(function(e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
    }).finally(function() {
      that.setData({ loading: false });
    });
  },

  filterJobs: function() {
    var active = this.data.activeTab;
    var all = this.data.allJobs;
    var filtered = all;
    if (active !== 'all') {
      filtered = [];
      for (var i = 0; i < all.length; i++) {
        if (all[i].status === active) filtered.push(all[i]);
      }
    }
    this.setData({ jobs: filtered, showEmpty: filtered.length === 0 });
  },

  switchTab: function(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab });
    this.filterJobs();
  },

  goPostJob: function() {
    wx.navigateTo({ url: '/pages/post-job/post-job' });
  },

  goDetail: function(e) {
    wx.navigateTo({ url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id + '&from=enterprise' });
  },

  goEdit: function(e) {
    wx.showToast({ title: '编辑功能开发中', icon: 'none' });
  },

  toggleStatus: function(e) {
    var that = this;
    var id = e.currentTarget.dataset.id;
    var job = null;
    for (var i = 0; i < this.data.allJobs.length; i++) {
      if (this.data.allJobs[i].id == id) { job = this.data.allJobs[i]; break; }
    }
    if (!job) return;

    if (job.audit_status === 'pending') {
      wx.showToast({ title: '审核中，暂不可操作', icon: 'none' });
      return;
    }
    if (job.audit_status === 'rejected') {
      wx.showToast({ title: '审核未通过，无法上线', icon: 'none' });
      return;
    }

    var newStatus = job.status === 'online' ? 'offline' : 'online';
    var text = newStatus === 'online' ? '上线' : '下线';
    wx.showModal({
      title: '确认' + text,
      content: '确定要' + text + '这个职位吗？',
      success: function(res) {
        if (res.confirm) {
          api.jobs.update(id, { status: newStatus }).then(function() {
            wx.showToast({ title: '已' + text, icon: 'success' });
            that.loadJobs();
          }).catch(function(e) {
            wx.showToast({ title: e.message || '操作失败', icon: 'none' });
          });
        }
      }
    });
  }
});
