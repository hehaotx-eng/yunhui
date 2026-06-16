const { applications } = require('../../utils/api.js');
const { resolve } = require('../../utils/image');

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
      let list = Array.isArray(result) ? result : (result.list || result || []);
      list = list.map(item => {
        if (item.company_logo) item.company_logo = resolve(item.company_logo);
        if (item.logo) item.logo = resolve(item.logo);
        return item;
      });
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

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },

  goBrowse() {
    wx.switchTab({ url: '/pages/webs/webs' });
  }
});
