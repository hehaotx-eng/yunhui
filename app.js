App({
  onLaunch() {
    this.initUserState()
  },

  onShow() {
    this.checkUserRole()
  },

  initUserState() {
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')

    this.globalData = {
      ...this.globalData,
      token: token || null,
      userInfo: userInfo || null,
      isEnterprise: !!(userInfo && userInfo.company_id),
      isUser: !(userInfo && userInfo.company_id)
    }
  },

  updateUserState(userInfo, token) {
    const isEnterprise = !!(userInfo && userInfo.company_id)

    this.globalData = {
      ...this.globalData,
      token: token,
      userInfo: userInfo,
      isEnterprise: isEnterprise,
      isUser: !isEnterprise
    }

    wx.setStorageSync('token', token)
    wx.setStorageSync('userInfo', userInfo)

    this.updateTabBar(isEnterprise ? 'enterprise' : 'user')
  },

  clearUserState() {
    this.globalData = {
      ...this.globalData,
      token: null,
      userInfo: null,
      isEnterprise: false,
      isUser: true
    }

    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
  },

  updateTabBar(role) {
    const pages = getCurrentPages()
    if (pages.length > 0) {
      const page = pages[pages.length - 1]
      if (page.getTabBar) {
        const tabBar = page.getTabBar()
        if (tabBar && tabBar.setRole) {
          tabBar.setRole(role)
        }
      }
    }
  },

  checkUserRole() {
    const token = this.globalData.token || wx.getStorageSync('token')
    const userInfo = this.globalData.userInfo || wx.getStorageSync('userInfo')

    if (token && userInfo) {
      const isEnterprise = !!userInfo.company_id
      this.updateTabBar(isEnterprise ? 'enterprise' : 'user')

      const pages = getCurrentPages()
      if (pages.length > 0) {
        const currentPage = pages[pages.length - 1]
        const currentRoute = currentPage.route

        if (isEnterprise) {
          const enterprisePages = [
            'pages/enterprise-home/enterprise-home',
            'pages/enterprise-jobs/enterprise-jobs',
            'pages/candidates/candidates',
            'pages/enterpriseDashboard/enterpriseDashboard',
            'pages/enterprise-my/enterprise-my'
          ]
          if (!enterprisePages.includes(currentRoute)) {
            wx.reLaunch({ url: '/pages/enterprise-home/enterprise-home' })
          }
        }
      }
    }
  },

  isLoggedIn() {
    return !!(this.globalData.token || wx.getStorageSync('token'))
  },

  isEnterprise() {
    const userInfo = this.globalData.userInfo || wx.getStorageSync('userInfo')
    return !!(userInfo && userInfo.company_id)
  },

  globalData: {
    token: null,
    userInfo: null,
    isEnterprise: false,
    isUser: true
  }
})
