const { auth, clearAuth, favorites, resumes, notifications } = require('../../utils/api.js');
const { checkAuth } = require('../../utils/auth-check.js');

Page({
  data: {
    userInfo: null,
    avatarLetter: '用',
    applicationCount: 0,
    favoriteCount: 0,
    notificationCount: 0,
    menus: [
      { icon: '📋', title: '我的投递', desc: '查看投递进度', url: '/pages/applications/applications' },
      { icon: '❤️', title: '我的收藏', desc: '已收藏职位', url: '/pages/favorites/favorites' },
      { icon: '🔔', title: '系统通知', desc: '投递、审核与平台通知', url: '/pages/notifications/notifications' },
      { icon: '🏢', title: '企业认证', desc: '企业用户完善认证资料', url: '/pages/register/register?role=enterprise' },
      { icon: '⚙️', title: '账号设置', desc: '安全设置与隐私', url: '' },
      { icon: '💬', title: '意见反馈', desc: '帮助与建议', url: '' }
    ]
  },

  onShow() {
    // 检测用户身份
    const authResult = checkAuth(this, { redirectIfEnterprise: true });
    if (authResult.blocked) return;
    
    this.setData({ userInfo: authResult.userInfo || null });
    if (this.data.userInfo) {
      this.setData({ avatarLetter: this.getAvatarLetter(this.data.userInfo) });
      this.loadStats();
    }
  },

  getAvatarLetter(user) {
    const name = user.username || user.phone || '用';
    return name.substring(0, 1);
  },

  async loadStats() {
    if (!wx.getStorageSync('token')) return;
    try {
      const [favRes, resumeRes, notifyRes] = await Promise.all([
        favorites.getList(),
        resumes.getMyResumes(),
        notifications.getMine({ unread: true })
      ]);
      const favList = Array.isArray(favRes) ? favRes : (favRes.data || favRes.list || []);
      const resumeList = Array.isArray(resumeRes) ? resumeRes : (resumeRes.data || resumeRes.list || []);
      const notifyList = Array.isArray(notifyRes) ? notifyRes : (notifyRes.data || notifyRes.list || []);
      this.setData({
        favoriteCount: favList.length,
        applicationCount: resumeList.length,
        notificationCount: notifyList.length
      });
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  },

  goPage(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) {
      wx.showToast({ title: '功能开发中', icon: 'none' });
      return;
    }
    wx.navigateTo({ url });
  },

  async logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await auth.logout();
          } catch (error) {
            clearAuth();
          }
          this.setData({ userInfo: null, avatarLetter: '用', applicationCount: 0, favoriteCount: 0, notificationCount: 0 });
          wx.showToast({ title: '已退出', icon: 'none' });
        }
      }
    });
  }
});