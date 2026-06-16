const { applications } = require('../../utils/api.js');

Page({
  data: {
    active: '',
    tabs: [
      { id: '', name: '全部' },
      { id: 'pending', name: '待处理' },
      { id: 'viewed', name: '已查看' },
      { id: 'accepted', name: '已通过' },
      { id: 'rejected', name: '已拒绝' }
    ],
    allList: [],
    list: [],
    loading: true,
    showEmpty: false
  },

  onLoad() {
    this.loadList();
  },

  onPullDownRefresh() {
    this.loadList().finally(() => wx.stopPullDownRefresh());
  },

  switchTab(e) {
    this.setData({ active: e.currentTarget.dataset.id });
    this.filterList();
  },

  async loadList() {
    this.setData({ loading: true });
    try {
      const result = await applications.getMy();
      const list = Array.isArray(result) ? result : (result.list || result || []);
      this.setData({ allList: list });
      this.filterList();
    } catch (error) {
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  filterList() {
    const { active, allList } = this.data;
    let filtered = allList;
    if (active) {
      filtered = allList.filter(a => a.status === active);
    }
    this.setData({ list: filtered, showEmpty: filtered.length === 0 });
  },

  getStatusText(status) {
    const map = {
      pending: '待处理',
      viewed: '已查看',
      accepted: '已通过',
      rejected: '已拒绝'
    };
    return map[status] || status;
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  }
});
