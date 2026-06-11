// app.js
App({
  onLaunch() {
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 初始化全局用户状态
    this.initUserState()

    wx.login({
      success: res => {
      }
    })
  },
  
  onShow() {
    this.checkUserRole()
  },
  
  // 初始化用户状态
  initUserState() {
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    const userRole = wx.getStorageSync('userRole')
    
    this.globalData = {
      ...this.globalData,
      token: token || null,
      userInfo: userInfo || null,
      userRole: userRole || null,
      isAdmin: userInfo && userInfo.userType === 'admin',
      isEnterprise: userInfo && userInfo.userType === 'enterprise',
      isUser: userInfo && userInfo.userType === 'user'
    }
  },
  
  // 更新用户状态（登录后调用）
  updateUserState(userInfo, token) {
    const userRole = userInfo && userInfo.userType
    
    this.globalData = {
      ...this.globalData,
      token: token,
      userInfo: userInfo,
      userRole: userRole,
      isAdmin: userRole === 'admin',
      isEnterprise: userRole === 'enterprise',
      isUser: userRole === 'user'
    }
    
    wx.setStorageSync('token', token)
    wx.setStorageSync('userInfo', userInfo)
    wx.setStorageSync('userRole', userRole)
  },
  
  // 清除用户状态（退出登录时调用）
  clearUserState() {
    this.globalData = {
      ...this.globalData,
      token: null,
      userInfo: null,
      userRole: null,
      isAdmin: false,
      isEnterprise: false,
      isUser: false
    }
    
    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('userRole')
  },
  
  // 检查用户角色并跳转
  checkUserRole() {
    const token = this.globalData.token || wx.getStorageSync('token')
    const userRole = this.globalData.userRole || wx.getStorageSync('userRole')
    
    if (token && userRole) {
      const pages = getCurrentPages()
      if (pages.length > 0) {
        const currentPage = pages[pages.length - 1]
        const currentRoute = currentPage.route
        
        if (userRole === 'enterprise' || userRole === 'admin') {
          const enterprisePages = [
            'pages/enterprise-home/enterprise-home',
            'pages/candidates/candidates', 
            'pages/enterprise-jobs/enterprise-jobs',
            'pages/enterprise-msg/enterprise-msg',
            'pages/enterprise-my/enterprise-my'
          ]
          
          if (!enterprisePages.includes(currentRoute)) {
            wx.reLaunch({ url: '/pages/enterprise-home/enterprise-home' })
          }
        }
      }
    }
  },
  
  // 检查是否登录
  isLoggedIn() {
    return !!(this.globalData.token || wx.getStorageSync('token'))
  },
  
  // 检查是否是企业用户
  isEnterprise() {
    const userRole = this.globalData.userRole || wx.getStorageSync('userRole')
    return userRole === 'enterprise' || userRole === 'admin'
  },
  
  // 检查是否是管理员
  isAdmin() {
    const userRole = this.globalData.userRole || wx.getStorageSync('userRole')
    return userRole === 'admin'
  },
  
  globalData: {
    token: null,
    userInfo: null,
    userRole: null,
    isAdmin: false,
    isEnterprise: false,
    isUser: false
  }
})