const { auth, applications, resumes, favorites } = require('../../utils/api.js');

Page({
  data: {
    statusBarHeight: 0,
    userInfo: null,
    isEnterprise: false,
    isLoggedIn: false,
    avatarLetter: '用',
    stats: {
      applicationCount: 0,
      favoriteCount: 0,
      resumeCount: 0
    },
    resumeList: [],
    menus: [
      { icon: '投', title: '我的投递', desc: '查看投递进度', url: '/pages/applications/applications', color: '#ff5c39' },
      { icon: '收', title: '我的收藏', desc: '已收藏的职位', url: '/pages/favorites/favorites', color: '#f59e0b' },
      { icon: '消', title: '消息通知', desc: '查看系统通知', url: '/pages/notifications/notifications', color: '#6d5efc' },
      { icon: '企', title: '企业认证', desc: '企业用户入驻', url: '/pages/register/register?role=enterprise', color: '#22c55e' },
      { icon: '设', title: '账号设置', desc: '安全与隐私', url: '', color: '#6b7280' }
    ]
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20 });
  },

  onShow() {
    const app = getApp();
    const tabBar = this.getTabBar();
    if (tabBar) {
      tabBar.setRole(app.globalData.isEnterprise ? 'enterprise' : 'user');
      tabBar.setSelected(4);
    }
    this.loadUserInfo();
  },

  async loadUserInfo() {
    const app = getApp();
    const token = app.globalData.token || wx.getStorageSync('token');
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');

    if (!token) {
      this.setData({ isLoggedIn: false, userInfo: null });
      return;
    }

    this.setData({ isLoggedIn: true });

    try {
      const fresh = await auth.getMe();
      if (fresh) {
        app.updateUserState(fresh, token);
        this.setData({
          userInfo: fresh,
          isEnterprise: !!fresh.company_id,
          avatarLetter: (fresh.nickname || fresh.phone || '用').substring(0, 1)
        });
      }
    } catch {
      if (userInfo) {
        this.setData({
          userInfo,
          isEnterprise: !!userInfo.company_id,
          avatarLetter: (userInfo.nickname || userInfo.phone || '用').substring(0, 1)
        });
      }
    }

    this.loadStats();
  },

  async loadStats() {
    try {
      const [myApps, myResumes, fav] = await Promise.all([
        applications.getMy().catch(() => []),
        resumes.getMy().catch(() => []),
        favorites.getCount().catch(() => ({ count: 0 }))
      ]);
      this.setData({
        'stats.applicationCount': Array.isArray(myApps) ? myApps.length : 0,
        'stats.favoriteCount': fav.count || 0,
        'stats.resumeCount': Array.isArray(myResumes) ? myResumes.length : 0,
        resumeList: Array.isArray(myResumes) ? myResumes : []
      });
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

  goCreateResume() {
    wx.navigateTo({ url: '/pages/create-resume/create-resume' });
  },

  goPreviewResume(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/resume-preview/resume-preview?id=${id}` });
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
