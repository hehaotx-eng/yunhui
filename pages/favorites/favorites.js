const { favorites } = require('../../utils/api');

Page({
  data: { list: [], loading: true, showEmpty: false },
  onShow() { this.loadList(); },
  onPullDownRefresh() { this.loadList().finally(() => wx.stopPullDownRefresh()); },
  async loadList() {
    this.setData({ loading: true });
    try {
      const list = await favorites.getList();
      this.setData({ list, loading: false, showEmpty: list.length === 0 });
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
    }
  },
  goDetail(e) {
    wx.navigateTo({ url: `/pages/detail/detail?id=${e.currentTarget.dataset.id}` });
  },

  onShareAppMessage() {
    return { title: '我的收藏 - 心仪岗位', path: '/pages/favorites/favorites' };
  },

  onShareTimeline() {
    return { title: '我的收藏 - 心仪岗位' };
  }
});
