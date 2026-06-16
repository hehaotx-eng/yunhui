Component({
  properties: {
    title: {
      type: String,
      value: ''
    },
    showBack: {
      type: Boolean,
      value: false
    }
  },
  data: {
    statusBarHeight: 0
  },
  attached() {
    const sysInfo = wx.getSystemInfoSync()
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight || 20
    })
  },
  methods: {
    handleBack() {
      wx.navigateBack({
        fail: () => {
          wx.switchTab({
            url: '/pages/enterprise-home/enterprise-home'
          })
        }
      })
    }
  }
})
