const { jobs, applications, request } = require('../../utils/api.js');

Page({
  data: {
    loading: false,

    stats: {
      jobs: 0,
      online: 0,
      applicants: 0,
      candidates: 0
    },

    myJobs: [],
    recentApps: []
  },

  onLoad() {
    this.checkCompanyStatus();
  },

  onShow() {
    this.checkCompanyStatus();
  },

  async checkCompanyStatus() {
    try {
      const companyInfo = await request({ url: '/api/v1/enterprise/company-info' });
      if (!companyInfo || companyInfo.status !== 'approved') {
        wx.redirectTo({ url: '/pages/approval-pending/approval-pending' });
        return;
      }
      this.loadData();
    } catch (e) {
      console.log('检查企业状态失败:', e.message);
      wx.redirectTo({ url: '/pages/approval-pending/approval-pending' });
    }
  },

  async loadData() {
    this.setData({ loading: true });

    try {
      const [jobList, appList] = await Promise.all([
        this.fetchJobs(),
        this.fetchApplications()
      ]);

      const stats = this.calcStats(jobList, appList);

      this.setData({
        stats,
        myJobs: jobList.slice(0, 5),
        recentApps: appList.slice(0, 5),
        loading: false
      });

    } catch (err) {
      console.error('加载企业数据失败:', err);
      this.setData({ loading: false });
    }
  },

  /* ======================
     数据请求层（拆清楚）
  ====================== */

  async fetchJobs() {
    try {
      const result = await jobs.getMyList();
      return Array.isArray(result)
        ? result
        : (result.list || result.rows || []);
    } catch (e) {
      console.log('jobs fallback:', e.message);
      return [];
    }
  },

  async fetchApplications() {
    try {
      return await request({
        url: '/api/v1/enterprise/applications'
      }) || [];
    } catch (e) {
      console.log('apps fallback:', e.message);
      return [];
    }
  },

  /* ======================
     统计逻辑（纯函数化）
  ====================== */

  calcStats(jobList, appList) {
    const online = jobList.filter(item => item.status === 'online').length;

    const uniqueUsers = new Set(
      appList.map(item => item.user_name).filter(Boolean)
    );

    return {
      jobs: jobList.length,
      online,
      applicants: appList.length,
      candidates: uniqueUsers.size
    };
  },

  /* ======================
     页面跳转（保持不变）
  ====================== */

  goPostJob() {
    wx.navigateTo({ url: '/pages/post-job/post-job' });
  },

  goApplications() {
    wx.navigateTo({ url: '/pages/enterprise-applications/enterprise-applications' });
  },

  goCandidates() {
    wx.switchTab({ url: '/pages/candidates/candidates' });
  },

  onChangeStatus(e) {
    const id = e.currentTarget.dataset.id;
    const current = e.currentTarget.dataset.status;
    wx.showActionSheet({
      itemList: ['标记为已查看', '标记为已通过', '标记为未通过'],
      success: (res) => {
        const map = ['viewed', 'accepted', 'rejected'];
        const status = map[res.tapIndex];
        if (status === current) return;
        applications.updateStatus(id, status).then(() => {
          wx.showToast({ title: '状态已更新', icon: 'success' });
          this.loadData();
        }).catch(e => {
          wx.showToast({ title: e.message || '操作失败', icon: 'none' });
        });
      }
    });
  },

  onShareAppMessage() {
    return { title: '企业首页 - 招聘管理', path: '/pages/enterprise-home/enterprise-home' };
  },

  onShareTimeline() {
    return { title: '企业首页 - 招聘管理' };
  }
});