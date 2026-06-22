const { chat } = require('../../utils/api.js');
const conversationStore = require('../../services/socket/conversationStore');
const socket = require('../../services/socket/socket');
const resolve = require('../../utils/image').resolve;

Page({
  data: {
    statusBarHeight: 0,
    conversations: [],
    loading: true,
    showEmptyTip: false,
    showLoginTip: false,

    isRefreshing: false,
    emptyType: 'default'
  },

  // ===== 状态控制 =====
  isDestroyed: false,
  isStoreSubscribed: false,
  pollingTimer: null,
  isFetching: false,
  lastFetchTime: 0,

  // ======================
  // 生命周期
  // ======================
  onLoad() {
    this.isDestroyed = false;
    this._bindStore = this._onStoreUpdate.bind(this);
    this._subscribeStore();
  },

  onShow() {
    this.isDestroyed = false;
    this._subscribeStore();

    if (!this.data.statusBarHeight) {
      const sys = wx.getSystemInfoSync();
      this.setData({
        statusBarHeight: sys.statusBarHeight || 20
      });
    }

    this._initTabBar();

    const cached = conversationStore.getConversations();
    if (cached?.length) {
      this._render(cached);
    } else {
      this.loadConversations();
    }

    this._startPolling();
  },

  onHide() {
    this._stopPolling();
    this._unsubscribeStore();
  },

  onUnload() {
    this.isDestroyed = true;
    this._stopPolling();
    this._unsubscribeStore();
  },

  // ======================
  // store 订阅（唯一数据源）
  // ======================
  _subscribeStore() {
    if (this.isStoreSubscribed) return;
    conversationStore.subscribe(this._bindStore);
    this.isStoreSubscribed = true;
  },

  _unsubscribeStore() {
    if (!this.isStoreSubscribed) return;
    conversationStore.unsubscribe(this._bindStore);
    this.isStoreSubscribed = false;
  },

  _onStoreUpdate(list) {
    if (this.isDestroyed) return;
    this._render(list);
  },

  // ======================
  // 渲染（唯一UI入口）
  // ======================
  _render(list) {
    const data = (list || []).map(conv => ({
      id: conv.id,
      name: this._getName(conv),
      avatar: this._getAvatar(conv),
      avatarChar: (this._getName(conv) || '联').charAt(0),
      lastMessage: conv.lastMessage || '暂无消息',
      unreadCount: conv.unreadCount || 0,
      time: this._formatTime(conv.lastTime)
    }));

    this.setData({
      conversations: data,
      loading: false,
      showEmptyTip: data.length === 0,
      emptyType: data.length === 0 ? 'noData' : 'default'
    });

    this._updateBadge();
  },

  // ======================
  // 拉取数据（防重复）
  // ======================
  async loadConversations() {
    const token = wx.getStorageSync('token');
    if (!token) return this._handleNoAuth();

    // 防抖 + 并发锁
    if (this.isFetching) return;
    if (Date.now() - this.lastFetchTime < 2000) return;

    this.isFetching = true;
    this.lastFetchTime = Date.now();

    try {
      const list = await chat.getConversations();
      if (this.isDestroyed) return;

      const normalized = this._normalize(list);

      // ⭐ 只写 store（唯一数据源）
      conversationStore.setConversations(normalized);

    } catch (e) {
      console.error(e);
      this._handleError();
    } finally {
      this.isFetching = false;
      this.setData({ loading: false });
    }
  },

  // ======================
  // 数据标准化（唯一转换层）
  // ======================
  _normalize(list) {
    return (list || []).map(conv => ({
      id: conv.id,
      name: this._getName(conv),
      avatar: this._getAvatar(conv),
      lastMessage: conv.last_message || '',
      lastTime: conv.last_message_time || new Date().toISOString(),
      unreadCount: conv.unread_count || 0,
      userId: conv.user_id || ''
    }));
  },

  // ======================
  // polling（安全版）
  // ======================
  _startPolling() {
    this._stopPolling();

    this.pollingTimer = setInterval(() => {
      if (socket.getState() === 'CONNECTED') return;
      this.loadConversations();
    }, 30000);
  },

  _stopPolling() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  },

  // ======================
  // 工具函数（统一）
  // ======================
  _getName(conv) {
    return conv.company_name ||
      conv.enterprise_name ||
      conv.nick_name ||
      conv.title ||
      '联系人';
  },

  _getAvatar(conv) {
    const url =
      conv.company_logo ||
      conv.avatar_url ||
      conv.avatar ||
      conv.user_avatar ||
      '';

    return url ? resolve(url) : '';
  },

  _formatTime(time) {
    if (!time) return '';
    const d = new Date(time);
    const now = new Date();
    const diff = (now - d) / 60000;

    if (diff < 1) return '刚刚';
    if (diff < 60) return `${Math.floor(diff)}分钟前`;
    if (diff < 1440) return `${Math.floor(diff / 60)}小时前`;
    return d.toLocaleDateString();
  },

  // ======================
  // badge（修复版）
  // ======================
  _updateBadge() {
    const total = conversationStore.getTotalUnread();
    const app = getApp();
    app.globalData.unreadCount = total;

    const pages = getCurrentPages();
    const page = pages[pages.length - 1];

    const tabBar = page.getTabBar?.();
    if (!tabBar) return;

    const user = app.globalData.userInfo || {};

    const index = user.company_id ? 2 : 3;
    tabBar.setBadge(index, total);
  },

  // ======================
  // tabbar初始化
  // ======================
  _initTabBar() {
    const app = getApp();
    const tabBar = this.getTabBar();
    if (!tabBar) return;

    const user = app.globalData.userInfo || {};
    tabBar.setRole(app.globalData.isEnterprise ? 'enterprise' : 'user');
    tabBar.setSelected(user.company_id ? 2 : 3);
  },

  // ======================
  // 状态处理
  // ======================
  _handleNoAuth() {
    this.setData({
      conversations: [],
      showLoginTip: true,
      loading: false
    });
  },

  _handleError() {
    this.setData({
      loading: false,
      showEmptyTip: true
    });

    wx.showToast({
      title: '加载失败',
      icon: 'none'
    });
  },

  // ======================
  // 交互
  // ======================
  goChat(e) {
    const id = e.currentTarget.dataset.id;
    const name = e.currentTarget.dataset.name || '';
    const avatar = e.currentTarget.dataset.avatar || '';
    if (!id) return;

    wx.navigateTo({
      url: `/pages/chat/chat?conversationId=${id}&targetName=${encodeURIComponent(name)}&targetAvatar=${encodeURIComponent(avatar)}`
    });
  },

  goLogin() {
    wx.navigateTo({
      url: '/pages/login-phone/login-phone'
    });
  },

  onPullDownRefresh() {
    this.loadConversations().finally(() => {
      wx.stopPullDownRefresh();
    });
  }
});