// pages/detail/detail.js
const { posts } = require('../../utils/api.js');

Page({
  data: {
    job: null,
    isCollected: false
  },

  onLoad(options) {
    const id = options.id;
    if (id) {
      this.loadJobDetail(id);
    }
  },

  async loadJobDetail(id) {
    wx.showLoading({ title: '加载中...' });
    try {
      const data = await posts.getById(id);
      this.setData({ job: data });
    } catch (error) {
      console.error('加载职位详情失败:', error);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
    wx.hideLoading();
  },

  formatDate(dateStr) {
    if (!dateStr) return '未知';
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },

  callPhone() {
    const phone = this.data.job?.contactPhone;
    if (phone) {
      wx.makePhoneCall({ phoneNumber: phone });
    }
  },

  toggleCollect() {
    this.setData({ isCollected: !this.data.isCollected });
    wx.showToast({ 
      title: this.data.isCollected ? '已收藏' : '取消收藏', 
      icon: 'none' 
    });
  },

  onShareAppMessage() {
    const job = this.data.job;
    return {
      title: job ? `${job.title} - ${job.salary}` : '职位详情',
      path: `/pages/detail/detail?id=${this.data.job?.id}`
    };
  }
});