Component({
  properties: {
    current: {
      type: String,
      value: 'home'
    }
  },

  data: {
    tabs: [
      { id: 'home', icon: '🏠', text: '首页', url: '/pages/enterprise-home/enterprise-home' },
      { id: 'candidates', icon: '👥', text: '人才', url: '/pages/candidates/candidates' },
      { id: 'jobs', icon: '💼', text: '岗位', url: '/pages/enterprise-jobs/enterprise-jobs' },
      { id: 'msg', icon: '💬', text: '消息', url: '/pages/enterprise-msg/enterprise-msg' },
      { id: 'my', icon: '👤', text: '我的', url: '/pages/enterprise-my/enterprise-my' }
    ]
  },

  methods: {
    switchTab(e) {
      const id = e.currentTarget.dataset.id;
      if (id === this.properties.current) return;
      
      const tab = this.data.tabs.find(t => t.id === id);
      if (tab) {
        wx.reLaunch({ url: tab.url });
      }
    }
  }
});