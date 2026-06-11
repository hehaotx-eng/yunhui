const { conversations } = require('../../utils/api.js');
const { checkAuth } = require('../../utils/auth-check.js');

Page({
  data: {
    conversations: [],
    loading: true,
    token: '',
    showLoginTip: false,
    showEmptyTip: false
  },

  onShow() {
    // 检测用户身份
    const authResult = checkAuth(this, { redirectIfEnterprise: true });
    if (authResult.blocked) return;
    
    this.setData({ token: authResult.isLoggedIn ? 'valid' : '' });
    this.loadConversations();
  },

  onPullDownRefresh() {
    this.loadConversations().finally(() => wx.stopPullDownRefresh());
  },

  async loadConversations() {
    const token = wx.getStorageSync('token');
    if (!token) {
      this.setData({ 
        conversations: [], 
        loading: false, 
        token: '',
        showLoginTip: true,
        showEmptyTip: false
      });
      return;
    }
    this.setData({ loading: true, token, showLoginTip: false });
    try {
      const result = await conversations.getList();
      const list = Array.isArray(result) ? result : (result.data || result.list || []);
      const processedList = list.map(item => ({
        ...item,
        avatarLetter: item.enterpriseName ? item.enterpriseName.substring(0,1) : (item.username ? item.username.substring(0,1) : '聊'),
        formattedTime: this.formatTime(item.lastMessageAt || item.last_message_at),
        showBadge: !! (item.unreadCount || item.unread_count),
        badgeText: (item.unreadCount || item.unread_count) > 99 ? '99+' : (item.unreadCount || item.unread_count)
      }));
      this.setData({ 
        conversations: processedList, 
        loading: false,
        showEmptyTip: processedList.length === 0
      });
    } catch (error) {
      this.setData({ loading: false, showEmptyTip: true });
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    }
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
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  },

  goChat(e) {
    wx.navigateTo({ url: `/pages/chat/chat?id=${e.currentTarget.dataset.id}` });
  },

  goNotifications() {
    wx.navigateTo({ url: '/pages/notifications/notifications' });
  }
});