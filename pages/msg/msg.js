const { chat } = require('../../utils/api.js');

Page({
  data: {
    statusBarHeight: 0,
    conversations: [],
    loading: true,
    showEmptyTip: false
  },

  onShow() {
    if (!this.data.statusBarHeight) {
      var sys = wx.getSystemInfoSync();
      this.setData({ statusBarHeight: sys.statusBarHeight || 20 });
    }
    const app = getApp();
    const tabBar = this.getTabBar();
    if (tabBar) {
      tabBar.setRole(app.globalData.isEnterprise ? 'enterprise' : 'user');
      const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo') || {};
      tabBar.setSelected(userInfo.company_id ? 2 : 3);
    }
    this.loadConversations();
  },

  onPullDownRefresh() {
    this.loadConversations().finally(() => wx.stopPullDownRefresh());
  },

  async loadConversations() {
    const token = wx.getStorageSync('token');
    if (!token) {
      this.setData({ conversations: [], loading: false, showEmptyTip: true });
      return;
    }

    this.setData({ loading: true });
    try {
      const list = await chat.getConversations();
      this.setData({
        conversations: Array.isArray(list) ? list : [],
        showEmptyTip: (Array.isArray(list) ? list : []).length === 0
      });
    } catch (e) {
      console.error('加载会话失败:', e);
      this.setData({ conversations: [], showEmptyTip: true });
    } finally {
      this.setData({ loading: false });
    }
  },

  goChat(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/chat/chat?conversationId=${id}` });
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/login-phone/login-phone' });
  }
});
