const { auth, jobs, applications } = require('../../utils/api.js');

Page({
  data: {
    userInfo: {},
    stats: { jobs: 0, applications: 0 },
    statusBarHeight: 0
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20 });
    this.checkUserRole();
    this.loadData();
  },

  onShow() {
  },

  checkUserRole() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    if (!userInfo.company_id) {
      wx.reLaunch({ url: '/pages/login-phone/login-phone' });
    }
  },

  async loadData() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    this.setData({ userInfo });

    try {
      const myJobs = await jobs.getMyList();
      const jobList = Array.isArray(myJobs) ? myJobs : (myJobs.list || myJobs.rows || []);
      this.setData({ 'stats.jobs': jobList.length });
    } catch (e) {
      console.error('加载统计失败:', e);
    }
  },

  handleLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          const app = getApp();
          app.clearUserState();
          app.updateTabBar('user');
          wx.reLaunch({ url: '/pages/home/home' });
        }
      }
    });
  }
});
