const { favorites } = require('../../utils/api.js');

Page({
  data: { list: [], loading: true, showEmpty: false },
  onLoad() { this.loadList(); },
  onPullDownRefresh() { this.loadList().finally(() => wx.stopPullDownRefresh()); },
  async loadList() {
    this.setData({ loading: true });
    try {
      const result = await favorites.getList();
      const list = Array.isArray(result) ? result : (result.data || result.list || []);
      this.setData({ list, loading: false, showEmpty: list.length === 0 });
    } catch (error) {
      this.setData({ loading: false });
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    }
  },
  goDetail(e) { wx.navigateTo({ url: `/pages/detail/detail?id=${e.currentTarget.dataset.id}` }); }
});
