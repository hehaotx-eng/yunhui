const { auth, applications } = require('../../utils/api.js');

Page({
  data: {
    userInfo: null,
    isEnterprise: false,
    avatarLetter: '用',
    applicationCount: 0,
    menus: [
      { icon: '📋', title: '我的投递', desc: '查看投递进度', url: '/pages/applications/applications' },
      { icon: '❤️', title: '我的收藏', desc: '已收藏职位', url: '/pages/favorites/favorites' },
      { icon: '🏢', title: '企业认证', desc: '企业用户完善认证资料', url: '/pages/register/register?role=enterprise' },
      { icon: '⚙️', title: '账号设置', desc: '安全设置与隐私', url: '' }
    ]
  },

  onShow() {
    const app = getApp();
    const tabBar = this.getTabBar();
    if (tabBar) {
      tabBar.setRole(app.globalData.isEnterprise ? 'enterprise' : 'user');
      tabBar.setSelected(4);
    }

    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        userInfo,
        isEnterprise: !!userInfo.company_id,
        avatarLetter: (userInfo.nickname || userInfo.phone || '用').substring(0, 1)
      });
      this.loadStats();
    }
  },

  async loadStats() {
    try {
      const myApps = await applications.getMy();
      this.setData({ applicationCount: Array.isArray(myApps) ? myApps.length : 0 });
    } catch (e) {
      console.error('加载统计失败:', e);
    }
  },

  goPage(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) {
      wx.showToast({ title: '功能开发中', icon: 'none' });
      return;
    }
    wx.navigateTo({ url });
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/login-phone/login-phone' });
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
