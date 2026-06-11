const { jobs } = require('../../utils/api.js')

Page({
  data: {
    activeTab: 'all',
    tabs: [
      { id: 'all', name: '全部' },
      { id: 'active', name: '进行中' },
      { id: 'paused', name: '暂停' },
      { id: 'expired', name: '已过期' }
    ],
    jobs: [],
    showEmpty: false,
    loading: false,
    enterpriseId: null
  },

  onLoad() {
    this.checkUserRole()
    this.getEnterpriseId()
    this.loadJobs()
  },

  onShow() {
    this.loadJobs()
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

  async loadJobs() {
    this.setData({ loading: true })
    try {
      const enterpriseId = this.data.enterpriseId || 1
      const res = await jobs.getEnterpriseJobs(enterpriseId)
      console.log('企业职位列表:', res)
      console.log('当前 enterpriseId:', this.data.enterpriseId, '类型:', typeof this.data.enterpriseId)
      
      let allJobs = Array.isArray(res) ? res : (res.data || res.jobs || [])
      console.log('所有职位数量:', allJobs.length)
      console.log('职位示例:', allJobs[0])
      
      let filteredJobs = allJobs
      
      if (this.data.enterpriseId) {
        console.log('开始过滤，目标 enterpriseId:', this.data.enterpriseId)
        filteredJobs = filteredJobs.filter(job => {
          console.log(`职位 ${job.title} 的 enterpriseId:`, job.enterpriseId, '类型:', typeof job.enterpriseId, '匹配:', job.enterpriseId == this.data.enterpriseId)
          return job.enterpriseId == this.data.enterpriseId
        })
        console.log('过滤后职位数量:', filteredJobs.length)
      }
      
      if (this.data.activeTab !== 'all') {
        filteredJobs = filteredJobs.filter(job => job.status === this.data.activeTab)
      }
      
      this.setData({
        jobs: filteredJobs,
        total: filteredJobs.length,
        loading: false,
        showEmpty: filteredJobs.length === 0
      })
    } catch (error) {
      console.error('获取职位列表失败:', error)
      this.setData({ jobs: [], loading: false, showEmpty: true })
      wx.showToast({ title: error.message || '网络请求失败', icon: 'none' })
    }
  },

  switchTab(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ activeTab: id })
    this.loadJobs()
  },

  getStatusText(status) {
    const statusMap = {
      active: '进行中',
      paused: '暂停',
      expired: '已过期',
      published: '进行中',
      offline: '暂停'
    }
    return statusMap[status] || status
  },

  goAdd() {
    wx.navigateTo({ url: '/pages/post-job/post-job' })
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  },

  goEdit(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/post-job/post-job?id=${id}` })
  },

  goResume(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/resumes/resumes?jobId=${id}` })
  },

  async toggleStatus(e) {
    const id = e.currentTarget.dataset.id
    const job = this.data.jobs.find(j => j.id === id)
    if (!job) return

    const isActive = job.status === 'active' || job.status === 'published'
    const action = isActive ? 'offline' : 'publish'
    const actionText = isActive ? '下线' : '发布'

    wx.showModal({
      title: '确认操作',
      content: `确定要${actionText}该职位吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = isActive ? await jobs.offline(id) : await jobs.publish(id)
            if (result.success) {
              wx.showToast({ title: `${actionText}成功`, icon: 'success' })
              this.loadJobs()
            } else {
              wx.showToast({ title: result.message || `${actionText}失败`, icon: 'none' })
            }
          } catch (error) {
            wx.showToast({ title: error.message || '操作失败', icon: 'none' })
          }
        }
      }
    })
  },

  async deleteJob(e) {
    const id = e.currentTarget.dataset.id

    wx.showModal({
      title: '确认删除',
      content: '确定要删除该职位吗？此操作不可撤销。',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await jobs.delete(id)
            if (result.success) {
              wx.showToast({ title: '删除成功', icon: 'success' })
              this.loadJobs()
            } else {
              wx.showToast({ title: result.message || '删除失败', icon: 'none' })
            }
          } catch (error) {
            wx.showToast({ title: error.message || '删除失败', icon: 'none' })
          }
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
  },

  goMy() {
    wx.reLaunch({ url: '/pages/enterprise-my/enterprise-my' })
  }
})