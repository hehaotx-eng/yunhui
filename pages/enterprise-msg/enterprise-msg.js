Page({
  data: {
    conversations: [],
    showEmpty: false,
    loading: false
  },

  onLoad() {
    this.checkUserRole()
    this.loadConversations()
  },

  checkUserRole() {
    const userRole = wx.getStorageSync('userRole')
    if (!userRole || userRole !== 'enterprise') {
      wx.reLaunch({ url: '/pages/login-phone/login-phone' })
    }
  },

  loadConversations() {
    this.setData({ loading: true })
    setTimeout(() => {
      this.setData({
        conversations: [
          { id: 1, username: '张三', avatarLetter: '张', lastMessage: '您好，我对贵公司的前端岗位很感兴趣', formattedTime: '5分钟前', showBadge: true, badgeText: '3' },
          { id: 2, username: '李四', avatarLetter: '李', lastMessage: '请问面试结果什么时候能出来？', formattedTime: '30分钟前', showBadge: false },
          { id: 3, username: '王五', avatarLetter: '王', lastMessage: '简历已更新，请查看', formattedTime: '1小时前', showBadge: true, badgeText: '1' }
        ],
        loading: false,
        showEmpty: false
      })
    }, 500)
  },

  goChat(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/chat/chat?id=${id}` })
  },

  goNotifications() {
    wx.navigateTo({ url: '/pages/notifications/notifications' })
  },

  goHome() {
    wx.reLaunch({ url: '/pages/enterprise-home/enterprise-home' })
  },

  goCandidates() {
    wx.reLaunch({ url: '/pages/candidates/candidates' })
  },

  goJobs() {
    wx.reLaunch({ url: '/pages/enterprise-jobs/enterprise-jobs' })
  },

  goMy() {
    wx.reLaunch({ url: '/pages/enterprise-my/enterprise-my' })
  }
})