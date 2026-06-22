Page({
  data: {
    currentDate: '',
    loading: true,
    metricList: [],
    trendLabels: ['6/10', '6/11', '6/12', '6/13', '6/14', '6/15', '6/16'],
    trendValues: [45, 52, 48, 63, 58, 71, 89],
    funnel: [],
    recentApplications: [],
    recentJobs: []
  },

  onLoad() {
    this.setCurrentDate()
    this.loadData()
  },

  setCurrentDate() {
    const d = new Date()
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    const month = d.getMonth() + 1
    const day = d.getDate()
    const wd = weekdays[d.getDay()]
    this.setData({ currentDate: `${month}月${day}日 周${wd}` })
  },

  loadData() {
    this.setData({ loading: true })
    setTimeout(() => {
      this.setData({
        metricList: this.buildMetrics(),
        funnel: this.buildFunnel(),
        recentApplications: this.buildApplications(),
        recentJobs: this.buildJobs(),
        loading: false
      }, () => {
        this.drawTrendChart()
      })
    }, 400)
  },

  buildMetrics() {
    return [
      { key: 'newUsers', value: 128, label: '今日新增用户', trend: 12.5 },
      { key: 'newJobs', value: 36, label: '今日新增岗位', trend: -3.2 },
      { key: 'applications', value: 892, label: '今日投递数', trend: 8.1 },
      { key: 'conversion', value: 23.6, unit: '%', label: '投递转化率', trend: 1.2 }
    ]
  },

  buildFunnel() {
    const stages = [
      { stage: '简历浏览', count: 5860 },
      { stage: '职位点击', count: 2340 },
      { stage: '简历投递', count: 892 },
      { stage: '面试邀约', count: 356 },
      { stage: '成功入职', count: 98 }
    ]
    const maxCount = stages[0].count
    return stages.map((item, i) => ({
      ...item,
      percentage: Math.round((item.count / maxCount) * 1000) / 10,
      barColor: `rgba(37, 99, 235, ${1 - i * 0.18})`
    }))
  },

  buildApplications() {
    return [
      { id: 1, name: '张伟', job: '高级前端工程师', company: '字节跳动', time: '10分钟前', statusText: '待处理', statusClass: 'pending' },
      { id: 2, name: '李娜', job: '产品经理', company: '美团', time: '25分钟前', statusText: '已查看', statusClass: 'viewed' },
      { id: 3, name: '王强', job: '资深后端开发', company: '阿里巴巴', time: '41分钟前', statusText: '面试', statusClass: 'interview' },
      { id: 4, name: '赵敏', job: 'UI设计师', company: '腾讯', time: '1小时前', statusText: '待处理', statusClass: 'pending' },
      { id: 5, name: '刘洋', job: '数据分析师', company: '拼多多', time: '1小时前', statusText: '已查看', statusClass: 'viewed' },
      { id: 6, name: '陈静', job: 'HRBP', company: '京东', time: '2小时前', statusText: '已通过', statusClass: 'accepted' },
      { id: 7, name: '孙浩', job: '测试开发', company: '快手', time: '2小时前', statusText: '待处理', statusClass: 'pending' },
      { id: 8, name: '周婷', job: '运营主管', company: '小红书', time: '3小时前', statusText: '未通过', statusClass: 'rejected' },
      { id: 9, name: '吴凯', job: '算法工程师', company: '百度', time: '3小时前', statusText: '面试', statusClass: 'interview' },
      { id: 10, name: '黄丽', job: '市场经理', company: '滴滴', time: '4小时前', statusText: '已查看', statusClass: 'viewed' }
    ]
  },

  buildJobs() {
    return [
      { id: 1, title: '高级前端工程师', company: '字节跳动', salary: '30K-50K', time: '1小时前', statusText: '已上线', statusClass: 'online' },
      { id: 2, title: '资深后端开发', company: '阿里巴巴', salary: '35K-55K', time: '2小时前', statusText: '审核中', statusClass: 'pending' },
      { id: 3, title: '产品总监', company: '腾讯', salary: '50K-80K', time: '3小时前', statusText: '已上线', statusClass: 'online' },
      { id: 4, title: '数据分析负责人', company: '美团', salary: '40K-60K', time: '4小时前', statusText: '已上线', statusClass: 'online' },
      { id: 5, title: 'UI设计专家', company: '小红书', salary: '25K-45K', time: '5小时前', statusText: '暂停', statusClass: 'paused' },
      { id: 6, title: '算法工程师', company: '百度', salary: '40K-70K', time: '6小时前', statusText: '已上线', statusClass: 'online' },
      { id: 7, title: '测试架构师', company: '京东', salary: '30K-50K', time: '7小时前', statusText: '已上线', statusClass: 'online' },
      { id: 8, title: 'HRVP', company: '拼多多', salary: '60K-90K', time: '8小时前', statusText: '已下线', statusClass: 'closed' },
      { id: 9, title: '运维负责人', company: '快手', salary: '35K-55K', time: '9小时前', statusText: '审核中', statusClass: 'pending' },
      { id: 10, title: '市场总监', company: '滴滴', salary: '40K-65K', time: '10小时前', statusText: '已上线', statusClass: 'online' }
    ]
  },

  drawTrendChart() {
    const query = wx.createSelectorQuery()
    query.select('#trendChart')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0]) return
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = wx.getSystemInfoSync().pixelRatio
        const width = res[0].width
        const height = res[0].height

        canvas.width = width * dpr
        canvas.height = height * dpr
        ctx.scale(dpr, dpr)

        const values = this.data.trendValues
        const labels = this.data.trendLabels
        const pad = { top: 36, right: 24, bottom: 44, left: 48 }
        const chartW = width - pad.left - pad.right
        const chartH = height - pad.top - pad.bottom

        const maxVal = Math.max(...values) * 1.2
        const stepX = chartW / (values.length - 1)

        ctx.clearRect(0, 0, width, height)

        // grid lines
        ctx.strokeStyle = '#f0f1f3'
        ctx.lineWidth = 1
        for (let i = 0; i <= 3; i++) {
          const y = pad.top + (chartH / 3) * i
          ctx.beginPath()
          ctx.setLineDash([4, 4])
          ctx.moveTo(pad.left, y)
          ctx.lineTo(width - pad.right, y)
          ctx.stroke()
          ctx.setLineDash([])
        }

        // y-axis labels
        ctx.fillStyle = '#9ca3af'
        ctx.font = '10px system-ui, -apple-system, sans-serif'
        ctx.textAlign = 'right'
        ctx.textBaseline = 'middle'
        for (let i = 0; i <= 3; i++) {
          const val = Math.round((maxVal / 3) * (3 - i))
          const y = pad.top + (chartH / 3) * i
          ctx.fillText(String(val), pad.left - 10, y)
        }

        // x-axis labels
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        labels.forEach((label, i) => {
          const x = pad.left + stepX * i
          ctx.fillText(label, x, height - pad.bottom + 8)
        })

        // gradient fill
        const gradient = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH)
        gradient.addColorStop(0, 'rgba(37, 99, 235, 0.10)')
        gradient.addColorStop(1, 'rgba(37, 99, 235, 0.00)')

        ctx.beginPath()
        values.forEach((val, i) => {
          const x = pad.left + stepX * i
          const y = pad.top + chartH - (val / maxVal) * chartH
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        const lastX = pad.left + stepX * (values.length - 1)
        ctx.lineTo(lastX, pad.top + chartH)
        ctx.lineTo(pad.left, pad.top + chartH)
        ctx.closePath()
        ctx.fillStyle = gradient
        ctx.fill()

        // line
        ctx.beginPath()
        ctx.strokeStyle = '#2563eb'
        ctx.lineWidth = 2
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        values.forEach((val, i) => {
          const x = pad.left + stepX * i
          const y = pad.top + chartH - (val / maxVal) * chartH
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.stroke()

        // dots
        values.forEach((val, i) => {
          const x = pad.left + stepX * i
          const y = pad.top + chartH - (val / maxVal) * chartH

          ctx.beginPath()
          ctx.arc(x, y, 4, 0, Math.PI * 2)
          ctx.fillStyle = '#ffffff'
          ctx.fill()
          ctx.strokeStyle = '#2563eb'
          ctx.lineWidth = 2
          ctx.stroke()
        })
      })
  }
})