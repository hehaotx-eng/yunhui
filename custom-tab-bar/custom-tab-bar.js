const { BASE_URL } = require('../config/base');
const socket = require('../services/socket/socket');

const userTabs = [
  { pagePath: '/pages/home/home', text: '发现', iconImage: '/pages/image/logo/home.png', iconImageActive: '/pages/image/logo/home-active.png', icon: '◉' },
  { pagePath: '/pages/webs/webs', text: '公司', iconImage: '/pages/image/logo/jobs.png', iconImageActive: '/pages/image/logo/jobs-active.png', icon: '◎' },
  { pagePath: '/pages/aiRecommend/aiRecommend', text: '推荐', iconImage: '/pages/image/logo/recommend-active.png', iconImageActive: '/pages/image/logo/recommend.png', icon: '◈' },
  { pagePath: '/pages/msg/msg', text: '消息', iconImage: '/pages/image/logo/messages.png', iconImageActive: '/pages/image/logo/messages-active.png', icon: '◇' },
  { pagePath: '/pages/my/my', text: '我的', iconImage: '/pages/image/logo/profile.png', iconImageActive: '/pages/image/logo/profile-active.png', icon: '○' }
];

const enterpriseTabs = [
  { pagePath: '/pages/enterprise-home/enterprise-home', text: '首页', iconImage: '/pages/image/logo/home.png', iconImageActive: '/pages/image/logo/home-active.png', icon: '◉' },
  { pagePath: '/pages/enterprise-jobs/enterprise-jobs', text: '内容', iconImage: '/pages/image/logo/jobs.png', iconImageActive: '/pages/image/logo/jobs-active.png', icon: '◎' },
  { pagePath: '/pages/candidates/candidates', text: '互动', iconImage: '/pages/image/logo/messages.png', iconImageActive: '/pages/image/logo/messages-active.png', icon: '◇' },
  { pagePath: '/pages/enterpriseDashboard/enterpriseDashboard', text: '数据', icon: '◈' },
  { pagePath: '/pages/enterprise-my/enterprise-my', text: '我的', iconImage: '/pages/image/logo/profile.png', iconImageActive: '/pages/image/logo/profile-active.png', icon: '○' }
];

Component({
  data: {
    selected: 0,
    list: userTabs,
    badges: [0, 0, 0, 0, 0]
  },

  lifetimes: {
    attached() {
      this.fetchUnread();
      this.startPolling();
      this._onStateChange = this._handleSocketStateChange.bind(this);
      socket.on('stateChange', this._onStateChange);
    },
    detached() {
      this.stopPolling();
      if (this._onStateChange) {
        socket.off('stateChange', this._onStateChange);
      }
    }
  },

  pageLifetimes: {
    show() {
      const pages = getCurrentPages();
      const current = pages[pages.length - 1];
      if (current) {
        const route = '/' + current.route;
        const idx = this.data.list.findIndex(item => item.pagePath === route);
        if (idx !== -1) this.setData({ selected: idx });
      }
    }
  },

  methods: {
    switchTab(e) {
      const { index, path } = e.currentTarget.dataset;
      if (this.data.badges[index]) {
        var badges = this.data.badges;
        badges[index] = 0;
        this.setData({ badges: badges });
      }
      this.setData({ selected: index });
      wx.reLaunch({ url: path });
    },

    setRole(role) {
      this.setData({ list: (role === 'enterprise' || role === 'admin') ? enterpriseTabs : userTabs });
    },

    setSelected(index) {
      this.setData({ selected: index });
    },

    setBadge(index, count) {
      var badges = this.data.badges;
      badges[index] = count;
      this.setData({ badges: badges });
    },

    _handleSocketStateChange(data) {
      if (data.state === 'CONNECTED') {
        this.stopPolling();
      } else if (data.state === 'IDLE' || data.state === 'RECONNECTING' || data.state === 'CLOSED') {
        this.startPolling();
      }
    },

    startPolling() {
      this.stopPolling();

      var socketState = socket.getState();
      if (socketState === 'CONNECTED') {
        return;
      }

      this._pollTimer = setInterval(() => {
        var state = socket.getState();
        if (state === 'CONNECTED') {
          this.stopPolling();
          return;
        }
        this.fetchUnread();
      }, 10000);
    },

    stopPolling() {
      if (this._pollTimer) {
        clearInterval(this._pollTimer);
        this._pollTimer = null;
      }
    },

    fetchUnread() {
      var socketState = socket.getState();
      if (socketState === 'CONNECTED') {
        return;
      }

      var token = wx.getStorageSync('token');
      if (!token) return;
      var that = this;
      wx.request({
        url: BASE_URL + '/api/v1/chat/unread/count',
        header: { Authorization: 'Bearer ' + token },
        success: function(res) {
          if (res.data && res.data.code === 0) {
            var count = res.data.data.count || 0;
            var app2 = getApp();
            app2.globalData.unreadCount = count;
            that.setBadge(3, count);
          }
        },
        fail: function() {
          that.setBadge(3, 0);
        }
      });
    }
  }
});
