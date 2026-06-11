const { jobs } = require('../../utils/api.js')

Page({
  data: {
    stats: {
      applicants: 0,
      interviews: 0,
      jobs: 0
    },
    myJobs: [],
    enterpriseId: null,
    loading: false
  },

  onLoad() {
    this.checkUserRole()
    this.getEnterpriseId()
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  checkUserRole() {
    const userRole = wx.getStorageSync('userRole')
    if (!userRole || userRole !== 'enterprise') {
      wx.reLaunch({ url: '/pages/login-phone/login-phone' })
    }
  },

  getEnterpriseId() {
    const user = wx.getStorageSync('user')
    if (user && user.enterpriseId) {
      this.setData({ enterpriseId: user.enterpriseId })
    }
  },

  async loadData() {
    this.setData({ loading: true })
    try {
      const enterpriseId = this.data.enterpriseId || 1
      const res = await jobs.getEnterpriseJobs(enterpriseId)
      console.log('企业职位数据:', res)
      console.log('当前 enterpriseId:', this.data.enterpriseId, '类型:', typeof this.data.enterpriseId)
      
      let allJobs = Array.isArray(res) ? res : (res.data || res.jobs || [])
      console.log('所有职位数量:', allJobs.length)
      if (allJobs.length > 0) {
        console.log('职位示例:', allJobs[0])
      }
      
      if (this.data.enterpriseId) {
        console.log('开始过滤，目标 enterpriseId:', this.data.enterpriseId)
        allJobs = allJobs.filter(job => {
          console.log(`职位 ${job.title} 的 enterpriseId:`, job.enterpriseId, '类型:', typeof job.enterpriseId, '匹配:', job.enterpriseId == this.data.enterpriseId)
          return job.enterpriseId == this.data.enterpriseId
        })
        console.log('过滤后职位数量:', allJobs.length)
      }
      
      const jobList = allJobs.slice(0, 3)
      const totalApplicants = allJobs.reduce((sum, job) => sum + (job.applicantCount || 0), 0)
      const totalJobs = allJobs.length
      
      this.setData({
        myJobs: jobList,
        stats: {
          applicants: totalApplicants,
          interviews: Math.floor(totalApplicants * 0.3),
          jobs: totalJobs
        },
        loading: false
      })
    } catch (error) {
      console.error('获取企业职位失败:', error)
      this.setData({
        myJobs: [],
        stats: { applicants: 0, interviews: 0, jobs: 0 },
        loading: false
      })
      wx.showToast({ title: error.message || '网络请求失败', icon: 'none' })
    }
  },

  goPostJob() {
    wx.navigateTo({ url: '/pages/post-job/post-job' })
    console.log('跳转发布职位');
  },

  goCandidates() {
    wx.reLaunch({ url: '/pages/candidates/candidates' })
  },

  goJobDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
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