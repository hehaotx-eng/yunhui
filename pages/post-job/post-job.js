const { jobs } = require('../../utils/api.js')

Page({
  data: {
    isEdit: false,
    jobId: null,
    customTags: '',
    formData: {
      title: '',
      salaryMin: '',
      salaryMax: '',
      location: '',
      experience: '',
      education: '',
      description: '',
      requirements: '',
      tags: [],
      type: 'full-time',
      deadline: '',
      status: 'active'
    },
    experienceOptions: ['不限', '应届生', '1-3年', '3-5年', '5-8年', '8年以上'],
    educationOptions: ['不限', '大专', '本科', '硕士', '博士'],
    typeOptions: ['全职', '兼职', '实习'],
    tagOptions: ['包吃住', '餐补', '交通补助', '加班补贴', '五险一金', '年底双薪', '带薪年假', '节日福利', '免费培训', '晋升空间', '高温补贴', '夜班补贴', '计件工资', '保底工资']
  },

  onLoad(options) {
    if (options?.id) {
      this.setData({
        isEdit: true,
        jobId: options.id
      })
      this.loadJobData(options.id)
    }
  },

  async loadJobData(id) {
    try {
      wx.showLoading({ title: '加载中' })
      const job = await jobs.getById(id)
      if (job.salary) {
        const salaryMatch = job.salary.match(/(\d+)-(\d+)元/)
        if (salaryMatch) {
          this.setData({
            'formData.salaryMin': (parseInt(salaryMatch[1]) / 1000).toString(),
            'formData.salaryMax': (parseInt(salaryMatch[2]) / 1000).toString()
          })
        }
      } else if (job.salaryMin && job.salaryMax) {
        this.setData({
          'formData.salaryMin': (job.salaryMin / 1000).toString(),
          'formData.salaryMax': (job.salaryMax / 1000).toString()
        })
      }
      this.setData({
        formData: {
          ...this.data.formData,
          title: job.title || '',
          location: job.location || job.area || '',
          experience: job.experience || '',
          education: job.education || '',
          description: job.description || '',
          requirements: job.requirements || '',
          tags: job.tags || job.welfare || [],
          type: job.type || 'full-time',
          deadline: job.deadline ? job.deadline.split('T')[0] : '',
          status: job.status || 'active'
        }
      })
    } catch (error) {
      wx.showToast({ title: error.message || '加载失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  handleInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({
      [`formData.${field}`]: e.detail.value
    })
  },

  handleCustomTags(e) {
    this.setData({
      customTags: e.detail.value
    })
  },

  onExperienceChange(e) {
    const index = e.detail.value
    this.setData({
      'formData.experience': this.data.experienceOptions[index]
    })
  },

  onEducationChange(e) {
    const index = e.detail.value
    this.setData({
      'formData.education': this.data.educationOptions[index]
    })
  },

  onTypeChange(e) {
    const index = e.detail.value
    const typeMap = ['full-time', 'part-time', 'intern']
    this.setData({
      'formData.type': typeMap[index] || 'full-time'
    })
  },

  onDeadlineChange(e) {
    this.setData({
      'formData.deadline': e.detail.value
    })
  },

  toggleTag(e) {
    const value = e.currentTarget.dataset.value
    console.log('点击标签:', value)
    const tags = [...this.data.formData.tags]
    const index = tags.indexOf(value)
    if (index > -1) {
      tags.splice(index, 1)
    } else {
      tags.push(value)
    }
    this.setData({
      'formData.tags': tags
    })
    console.log('当前标签:', tags)
  },

  setStatus(e) {
    const value = e.currentTarget.dataset.value
    this.setData({
      'formData.status': value
    })
  },

  validate() {
    const { title, salaryMin, salaryMax, location, experience, education } = this.data.formData
    const toast = (title) => wx.showToast({ title, icon: 'none', duration: 2000 })
    
    if (!title || !title.trim()) {
      toast('❌ 职位名称不能为空')
      return false
    }
    if (!salaryMin || !salaryMin.trim()) {
      toast('❌ 最低薪资不能为空')
      return false
    }
    if (isNaN(parseInt(salaryMin))) {
      toast('❌ 最低薪资必须是数字')
      return false
    }
    if (!salaryMax || !salaryMax.trim()) {
      toast('❌ 最高薪资不能为空')
      return false
    }
    if (isNaN(parseInt(salaryMax))) {
      toast('❌ 最高薪资必须是数字')
      return false
    }
    if (parseInt(salaryMin) > parseInt(salaryMax)) {
      toast('❌ 最低薪资不能大于最高薪资')
      return false
    }
    if (!location || !location.trim()) {
      toast('❌ 工作地点不能为空')
      return false
    }
    if (!experience) {
      toast('❌ 请选择经验要求')
      return false
    }
    if (!education) {
      toast('❌ 请选择学历要求')
      return false
    }
    return true
  },

  async submit() {
    const toast = (title, icon = 'none', duration = 2000) => {
      wx.showToast({ title, icon, duration })
    }

    toast('正在提交...', 'loading')
    
    if (!this.validate()) {
      return
    }

    wx.showLoading({ title: '提交中...', mask: true })
    
    let tags = [...this.data.formData.tags]
    if (this.data.customTags.trim()) {
      const customTagList = this.data.customTags.split(',').map(t => t.trim()).filter(t => t)
      tags = [...new Set([...tags, ...customTagList])]
    }

    const userInfo = wx.getStorageSync('userInfo')
    const user = wx.getStorageSync('user')
    const enterpriseId = userInfo?.enterpriseId || user?.enterpriseId || userInfo?.id || user?.id || 1
    
    console.log('发布职位 - enterpriseId:', enterpriseId)
    console.log('发布职位 - userInfo:', userInfo)
    console.log('发布职位 - user:', user)

    const data = {
      title: this.data.formData.title,
      enterpriseId: enterpriseId,
      description: this.data.formData.description,
      area: this.data.formData.location,
      salary: `${this.data.formData.salaryMin * 1000}-${this.data.formData.salaryMax * 1000}元`,
      experience: this.data.formData.experience,
      education: this.data.formData.education,
      tags: tags,
      welfare: tags,
      category: '技术',
      workType: this.data.formData.type === 'full-time' ? '全职' : (this.data.formData.type === 'part-time' ? '兼职' : '实习'),
      requirements: this.data.formData.requirements ? [this.data.formData.requirements] : [],
      recruitCount: 1,
      status: 'published'
    }
    
    console.log('发布职位数据:', data)

    try {
      if (this.data.isEdit) {
        await jobs.update(this.data.jobId, data)
      } else {
        await jobs.create(data)
      }
      wx.hideLoading()
      toast(this.data.isEdit ? '✅ 修改成功' : '✅ 发布成功', 'success', 2500)
      setTimeout(() => {
        const pages = getCurrentPages()
        const prevPage = pages[pages.length - 2]
        if (prevPage && prevPage.loadJobs) {
          prevPage.loadJobs()
        }
        wx.navigateBack({ delta: 1 })
      }, 1500)
    } catch (error) {
      wx.hideLoading()
      const errorMsg = error.message || '提交失败'
      if (errorMsg.includes('401') || errorMsg.includes('登录')) {
        toast('❌ 登录已过期，请重新登录', 'none', 3000)
        setTimeout(() => {
          wx.reLaunch({ url: '/pages/login-phone/login-phone' })
        }, 2000)
      } else if (errorMsg.includes('403')) {
        toast('❌ 暂无权限发布职位', 'none', 3000)
      } else if (errorMsg.includes('network') || errorMsg.includes('网络')) {
        toast('❌ 网络请求失败，请稍后重试', 'none', 3000)
      } else {
        toast(`❌ ${errorMsg}`, 'none', 3000)
      }
    }
  },

  goBack() {
    wx.navigateBack()
  }
})