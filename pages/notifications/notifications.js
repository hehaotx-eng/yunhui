const { notifications } = require('../../utils/api.js');

Page({
  data: {
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

  async loadList() {
    this.setData({ loading: true });
    try {
      const result = await notifications.getMine();
      const list = Array.isArray(result) ? result : (result.data || result.list || []);
      this.setData({ list, loading: false, showEmpty: list.length === 0 });
    } catch (error) {
      this.setData({ loading: false });
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    }
  },

  getNotifyIcon() {
    return '';
  },

  formatTime(timeStr) {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return minutes <= 0 ? '刚刚' : `${minutes}分钟前`;
      }
      return `${hours}小时前`;
    } else if (days === 1) {
      return '昨天';
    } else {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
  },

  async markRead(e) {
    const id = e.currentTarget.dataset.id;
    try {
      await notifications.markRead(id);
      this.loadList();
    } catch (error) {}
  },

  onShareAppMessage() {
    return { title: '通知消息', path: '/pages/notifications/notifications' };
  },

  onShareTimeline() {
    return { title: '通知消息' };
  }
});