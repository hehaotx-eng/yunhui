Page({
  data: {
    userInfo: {},
    stats: {
      jobs: 0,
      resumes: 0,
      interviews: 0
    }
  },

  onLoad() {
    this.checkUserRole()
    this.loadData()
  },

  checkUserRole() {
    const userRole = wx.getStorageSync('userRole')
    if (!userRole || userRole !== 'enterprise') {
      wx.reLaunch({ url: '/pages/login-phone/login-phone' })
    }
  },

  loadData() {
    const userInfo = wx.getStorageSync('userInfo') || {}
    this.setData({
      userInfo: userInfo,
      stats: { jobs: 8, resumes: 45, interviews: 5 }
    })
  },

  goJobs() {
    wx.reLaunch({ url: '/pages/enterprise-jobs/enterprise-jobs' })
  },

  goResumes() {
    wx.navigateTo({ url: '/pages/resumes/resumes' })
  },

  goInterviews() {
    wx.navigateTo({ url: '/pages/interviews/interviews' })
  },

  goEnterpriseInfo() {
    wx.navigateTo({ url: '/pages/enterprise-info/enterprise-info' })
  },

  goProfile() {
    wx.navigateTo({ url: '/pages/profile/profile' })
  },

  goSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' })
  },

  goHelp() {
    wx.navigateTo({ url: '/pages/help/help' })
  },

  handleLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          const app = getApp()
          app.clearUserState()
          wx.reLaunch({ url: '/pages/home/home' })
        }
      }
    })
  },

  goHome() {
    wx.reLaunch({ url: '/pages/enterprise-home/enterprise-home' })
  },

  goCandidates() {
    wx.reLaunch({ url: '/pages/candidates/candidates' })
  },

  goMsg() {
    wx.reLaunch({ url: '/pages/enterprise-msg/enterprise-msg' })
  }
})