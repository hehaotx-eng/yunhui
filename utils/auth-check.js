/**
 * 用户身份检测工具
 * 用于在每个页面检测用户身份，并根据身份进行相应的跳转
 */

const app = getApp()

/**
 * 检测用户身份
 * @param {Object} page - 页面实例
 * @param {Object} options - 配置选项
 * @param {boolean} options.requireLogin - 是否需要登录
 * @param {boolean} options.redirectIfEnterprise - 如果是企业用户是否重定向
 * @returns {Object} - 用户身份信息
 */
function checkAuth(page, options = {}) {
  const { requireLogin = false, redirectIfEnterprise = true } = options
  
  const token = app.globalData.token || wx.getStorageSync('token')
  const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo')
  
  const result = {
    isLoggedIn: !!token,
    userInfo: userInfo,
    isEnterprise: !!(userInfo && userInfo.company_id),
    isUser: !(userInfo && userInfo.company_id)
  }
  
  // 如果需要登录但未登录，跳转到登录页
  if (requireLogin && !result.isLoggedIn) {
    wx.showModal({
      title: '提示',
      content: '请先登录',
      showCancel: true,
      cancelText: '暂不登录',
      confirmText: '去登录',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({ url: '/pages/login/login' })
        }
      }
    })
    return { ...result, blocked: true }
  }
  
  // 如果是企业用户且需要重定向
  if (result.isEnterprise && redirectIfEnterprise) {
    const pages = getCurrentPages()
    if (pages.length > 0) {
      const currentPage = pages[pages.length - 1]
      const currentRoute = currentPage.route
      
      const enterprisePages = [
        'pages/enterprise-home/enterprise-home',
        'pages/candidates/candidates', 
        'pages/enterprise-jobs/enterprise-jobs',
        'pages/enterprise-msg/enterprise-msg',
        'pages/enterprise-my/enterprise-my'
      ]
      
      if (!enterprisePages.includes(currentRoute)) {
        wx.reLaunch({ url: '/pages/enterprise-home/enterprise-home' })
        return { ...result, blocked: true }
      }
    }
  }
  
  return { ...result, blocked: false }
}

/**
 * 检测是否为企业用户
 * @returns {boolean}
 */
function isEnterprise() {
  const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo')
  return !!(userInfo && userInfo.company_id)
}

/**
 * 检测是否为管理员
 * @returns {boolean}
 */
function isAdmin() {
  const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo')
  return !!(userInfo && userInfo.is_admin)
}

/**
 * 检测是否已登录
 * @returns {boolean}
 */
function isLoggedIn() {
  const token = app.globalData.token || wx.getStorageSync('token')
  return !!token
}

/**
 * 获取用户信息
 * @returns {Object|null}
 */
function getUserInfo() {
  return app.globalData.userInfo || wx.getStorageSync('userInfo')
}

module.exports = {
  checkAuth,
  isEnterprise,
  isAdmin,
  isLoggedIn,
  getUserInfo
}
