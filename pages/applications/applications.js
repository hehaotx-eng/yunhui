const { resumes } = require('../../utils/api.js');

Page({
  data: {
    active: '',
    tabs: [
      { id: '', name: '全部' },
      { id: 'pending', name: '待查看' },
      { id: 'viewed', name: '已查看' },
      { id: 'interview', name: '面试' },
      { id: 'rejected', name: '不合适' }
    ],
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
    this.loadList();
  },

  async loadList() {
    this.setData({ loading: true });
    try {
      const result = await resumes.getMyResumes({ status: this.data.active });
      const list = Array.isArray(result) ? result : (result.data || result.list || []);
      this.setData({ list, loading: false, showEmpty: list.length === 0 });
    } catch (error) {
      this.setData({ loading: false });
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    }
  },

  getStatusText(status) {
    const map = {
      pending: '待查看',
      viewed: '已查看',
      interview: '面试中',
      rejected: '不合适',
      hired: '已录用'
    };
    return map[status] || status || '未知';
  },

  getStatusClass(status) {
    return status || 'pending';
  },

  formatTime(timeStr) {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (id) wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  }
});