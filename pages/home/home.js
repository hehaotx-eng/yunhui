const { banners, jobs, categories, notifications } = require('../../utils/api.js');
const { checkAuth } = require('../../utils/auth-check.js');

Page({
  data: {
    banners: [],
    notices: [],
    activeId: '',
    categories: [],
    jobs: [],
    userInfo: null,
    loading: false
  },

  onLoad(options) {
    // 检测用户身份
    const authResult = checkAuth(this, { redirectIfEnterprise: true });
    if (authResult.blocked) return;
    
    this.loadBanners();
    this.loadCategories();
    this.loadNotices();
    this.loadJobs();
    this.setData({ userInfo: authResult.userInfo });
  },

  onShow() {
    // 检测用户身份
    const authResult = checkAuth(this, { redirectIfEnterprise: true });
    if (authResult.blocked) return;
    
    this.setData({ userInfo: authResult.userInfo });
  },

  async loadBanners() {
    try {
      const data = await banners.getAll();
      const bannerList = data && data.data ? data.data : (data || []);
      this.setData({ banners: bannerList });
    } catch (error) {
      console.error('加载轮播图失败:', error);
      this.setData({ banners: [] });
    }
  },

  async loadCategories() {
    try {
      const data = await categories.getAll();
      const categoryList = data && data.data ? data.data : (data || []);
      this.setData({ 
        categories: categoryList,
        activeId: categoryList.length > 0 ? categoryList[0].id : ''
      });
    } catch (error) {
      console.error('加载分类失败:', error);
      this.setData({ categories: [], activeId: '' });
    }
  },

  async loadNotices() {
    try {
      const data = await notifications.getMine({ limit: 5 });
      console.log('后端返回的通知数据:', data);
      const noticeList = data && data.data ? data.data : (data || []);
      console.log('处理后的通知列表:', noticeList);
      this.setData({ notices: noticeList });
    } catch (error) {
      console.error('加载通知失败:', error);
      this.setData({ notices: [] });
    }
  },

  async loadJobs() {
    this.setData({ loading: true });
    try {
      const result = await jobs.getAll({ limit: 10 });
      const jobList = result && result.data ? result.data : (result || []);
      this.setData({ jobs: jobList });
    } catch (error) {
      console.error('加载职位失败:', error);
      this.setData({ jobs: [] });
    } finally {
      this.setData({ loading: false });
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
    this.loadJobsByCategory(id);
  },

  async loadJobsByCategory(categoryId) {
    this.setData({ loading: true });
    try {
      const params = { limit: 10 };
      if (categoryId) {
        params.categoryId = categoryId;
      }
      const result = await jobs.getAll(params);
      const jobList = result && result.data ? result.data : (result || []);
      this.setData({ jobs: jobList });
    } catch (error) {
      console.error('加载职位失败:', error);
      this.setData({ jobs: [] });
    } finally {
      this.setData({ loading: false });
    }
  },

  goNotice() {
    wx.navigateTo({ url: '/pages/notifications/notifications' });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },

  goAllJobs() {
    wx.switchTab({ url: '/pages/webs/webs' });
  },

  goResumeLibrary() {
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
            wx.navigateTo({ url: '/pages/login-phone/login-phone' });
          }
        }
      });
      return;
    }
    wx.navigateTo({ url: '/pages/candidates/candidates' });
  },

  goRetail() {
    wx.navigateTo({ url: '/pages/webs/webs?category=商超零售' });
  },

  goFactory() {
    wx.navigateTo({ url: '/pages/webs/webs?category=普工技工' });
  },

  goContact() {
    wx.showModal({
      title: '联系客服',
      content: '客服电话：400-888-8888',
      showCancel: false
    });
  },

  callPhone(e) {
    const phone = e.currentTarget.dataset.phone;
    wx.makePhoneCall({ phoneNumber: phone });
  },

  goSearch() {
    wx.navigateTo({ url: '/pages/search/search' });
  },

  goEnterpriseSwitch() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo && userInfo.userType === 'enterprise') {
      wx.reLaunch({ url: '/pages/enterprise-home/enterprise-home' });
    } else {
      wx.showModal({
        title: '提示',
        content: '请先登录企业账号',
        showCancel: true,
        cancelText: '取消',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/login-phone/login-phone' });
          }
        }
      });
    }
  },

  onPullDownRefresh() {
    this.loadBanners();
    this.loadCategories();
    this.loadNotices();
    this.loadJobs();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
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