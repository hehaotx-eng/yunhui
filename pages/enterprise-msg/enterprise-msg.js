Page({
  data: {
    conversations: [],
    showEmpty: false,
    loading: false,
    statusBarHeight: 0
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync()
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight || 20
    })
    this.checkUserRole()
    this.loadConversations()
  },

  checkUserRole() {
    const userInfo = wx.getStorageSync('userInfo') || {}
    if (!userInfo.company_id) {
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

})