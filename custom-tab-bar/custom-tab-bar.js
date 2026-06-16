const userTabs = [
  { pagePath: '/pages/home/home', text: '发现', icon: '◉' },
  { pagePath: '/pages/webs/webs', text: '职位', icon: '◎' },
  { pagePath: '/pages/aiRecommend/aiRecommend', text: '推荐', icon: '◈' },
  { pagePath: '/pages/msg/msg', text: '消息', icon: '◇' },
  { pagePath: '/pages/my/my', text: '我的', icon: '○' }
];

const enterpriseTabs = [
  { pagePath: '/pages/enterprise-home/enterprise-home', text: '首页', icon: '◉' },
  { pagePath: '/pages/enterprise-jobs/enterprise-jobs', text: '内容', icon: '◎' },
  { pagePath: '/pages/candidates/candidates', text: '互动', icon: '◇' },
  { pagePath: '/pages/enterpriseDashboard/enterpriseDashboard', text: '数据', icon: '◈' },
  { pagePath: '/pages/enterprise-my/enterprise-my', text: '我的', icon: '○' }
];

Component({
  data: {
    selected: 0,
    list: userTabs
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
      this.setData({ selected: index });
      wx.reLaunch({ url: path });
    },

    setRole(role) {
      this.setData({ list: (role === 'enterprise' || role === 'admin') ? enterpriseTabs : userTabs });
    },

    setSelected(index) {
      this.setData({ selected: index });
    }
  }
});
