const { BASE_URL } = require('../../config/base');

Component({
  properties: {
    current: {
      type: String,
      value: 'home'
    }
  },

  data: {
    tabs: [
      { id: 'home', text: '首页', url: '/pages/enterprise-home/enterprise-home', iconImage: '/pages/image/logo/home.png', iconImageActive: '/pages/image/logo/home-active.png' },
      { id: 'candidates', text: '人才', url: '/pages/candidates/candidates', iconImage: '/pages/image/logo/recommend-active.png', iconImageActive: '/pages/image/logo/recommend.png' },
      { id: 'jobs', text: '岗位', url: '/pages/enterprise-jobs/enterprise-jobs', iconImage: '/pages/image/logo/jobs.png', iconImageActive: '/pages/image/logo/jobs-active.png' },
      { id: 'msg', text: '消息', url: '/pages/enterprise-msg/enterprise-msg', iconImage: '/pages/image/logo/messages.png', iconImageActive: '/pages/image/logo/messages-active.png' },
      { id: 'my', text: '我的', url: '/pages/enterprise-my/enterprise-my', iconImage: '/pages/image/logo/profile.png', iconImageActive: '/pages/image/logo/profile-active.png' }
    ],
    badge: {}
  },

  pageLifetimes: {
    show: function() {
      this.fetchUnread();
    }
  },

  ready: function () {
    this.fetchUnread();
    this.startPolling();
  },

  detached: function () {
    this.stopPolling();
  },

  methods: {
    updateBadgeNow: function(count) {
      this.setBadge('msg', count);
      var app2 = getApp();
      app2.globalData.unreadCount = count;
    },
    switchTab(e) {
      const id = e.currentTarget.dataset.id;
      if (id === this.properties.current) return;
      var badge = this.data.badge;
      if (badge[id]) {
        badge[id] = 0;
        this.setData({ badge: badge });
      }
      const tab = this.data.tabs.find(t => t.id === id);
      if (tab) {
        wx.reLaunch({ url: tab.url });
      }
    },

    setBadge(tabId, count) {
      var badge = this.data.badge;
      badge[tabId] = count;
      this.setData({ badge: badge });
    },

    startPolling: function() {
      this.stopPolling();
      var that = this;
      this._pollTimer = setInterval(function() { that.fetchUnread(); }, 10000);
    },

    stopPolling() {
      if (this._pollTimer) {
        clearInterval(this._pollTimer);
        this._pollTimer = null;
      }
    },

    fetchUnread: function() {
      var token = wx.getStorageSync('token');
      if (!token) return;
      var that = this;
      var app = getApp();
      wx.request({
        url: BASE_URL + '/api/v1/chat/unread/count',
        header: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        success: function(res) {
          try {
            if (res.statusCode === 200 && res.data && res.data.code === 0) {
              var count = Number(res.data.data.count) || 0;
              app.globalData.unreadCount = count;
              that.setBadge('msg', count);
            }
          } catch(e) {}
        },
        fail: function() {
          that.setBadge('msg', 0);
        }
      });
    }
  }
});
