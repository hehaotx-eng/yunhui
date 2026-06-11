Page({
  data: {
    keyword: '',
    activeFilter: 'all',
    filters: [
      { id: 'all', name: '全部' },
      { id: 'online', name: '在线' },
      { id: 'graduate', name: '应届生' },
      { id: 'experienced', name: '有经验' }
    ],
    candidates: [],
    showEmpty: false,
    loading: false
  },

  onLoad() {
    this.checkUserRole()
    this.loadCandidates()
  },

  checkUserRole() {
    const userRole = wx.getStorageSync('userRole')
    if (!userRole || userRole !== 'enterprise') {
      wx.reLaunch({ url: '/pages/login-phone/login-phone' })
    }
  },

  loadCandidates() {
    this.setData({ loading: true })
    setTimeout(() => {
      this.setData({
        candidates: [
          { id: 1, username: '张三', education: '本科', experience: '3年经验', city: '北京', skills: ['React', 'Vue', 'Node.js'] },
          { id: 2, username: '李四', education: '硕士', experience: '5年经验', city: '上海', skills: ['Java', 'Spring', 'MySQL'] },
          { id: 3, username: '王五', education: '大专', experience: '1年经验', city: '广州', skills: ['Python', 'Django', 'Redis'] }
        ],
        loading: false,
        showEmpty: false
      })
    }, 500)
  },

  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value })
  },

  onSearch() {
    this.loadCandidates()
  },

  switchFilter(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ activeFilter: id })
    this.loadCandidates()
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/candidate-detail/candidate-detail?id=${id}` })
  },

  goHome() {
    wx.reLaunch({ url: '/pages/enterprise-home/enterprise-home' })
  },

  goJobs() {
    wx.reLaunch({ url: '/pages/enterprise-jobs/enterprise-jobs' })
  },

  goMsg() {
    wx.reLaunch({ url: '/pages/enterprise-msg/enterprise-msg' })
  },

  goMy() {
    wx.reLaunch({ url: '/pages/enterprise-my/enterprise-my' })
  }
})