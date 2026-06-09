// pages/home/home.js
const { banners, jobs } = require('../../utils/api.js');

Page({
  data: {
    banners: [],
    notices: [
      { id: 1, title: '系统将于今晚23:00进行维护升级' },
      { id: 2, title: '新用户注册立享8折优惠' },
      { id: 3, title: '您的订单已发货，请注意查收' }
    ],
    activeId: 1,
    categories: [
      { id: 1, name: '全部', icon: '' },
      { id: 2, name: '市场销售', icon: '' },
      { id: 3, name: '行政人事', icon: '' },
      { id: 4, name: '客户服务', icon: '' },
      { id: 5, name: '普工技工', icon: '' },
      { id: 6, name: '财务审计', icon: '' },
      { id: 7, name: '文职文员', icon: '' },
      { id: 8, name: '直播', icon: '' }
    ],
    jobs: [],
    userInfo: null
  },

  onLoad(options) {
    this.loadBanners();
    this.loadJobs();
    this.checkLoginStatus();
  },

  onShow() {
    this.checkLoginStatus();
  },

  async loadBanners() {
    try {
      const data = await banners.getAll();
      this.setData({ banners: data || [] });
    } catch (error) {
      console.error('加载轮播图失败:', error);
      this.setData({ banners: [] });
    }
  },

  async loadJobs() {
    try {
      const result = await jobs.getAll();
      if (result && result.data && result.data.length > 0) {
        this.setData({ jobs: result.data });
      }
    } catch (error) {
      console.error('加载职位失败:', error);
    }
  },


  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({ userInfo });
    }
  },

  switchCategory(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ activeId: id });
  },

  goNotice() {
    this.showLoginModal();
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    this.showLoginModal(() => {
      wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
    });
  },

  callPhone(e) {
    this.showLoginModal(() => {
      const phone = e.currentTarget.dataset.phone;
      wx.makePhoneCall({ phoneNumber: phone });
    });
  },

  showLoginModal(callback) {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        showCancel: true,
        cancelText: '暂不登录',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/login/login' });
          }
        }
      });
    } else if (callback) {
      callback();
    }
  },

  onPullDownRefresh() {
    wx.stopPullDownRefresh();
  },

  onReachBottom() {
    wx.showToast({ title: '已加载全部', icon: 'none' });
  },

  onShareAppMessage() {
    return {
      title: '在线招聘',
      path: '/pages/home/home'
    };
  }
});