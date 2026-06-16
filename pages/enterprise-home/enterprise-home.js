const { jobs, applications, request } = require('../../utils/api.js');

Page({
  data: {
    statusBarHeight: 0,
    loading: true,
    stats: { jobs: 0, online: 0, applicants: 0, candidates: 0 },
    myJobs: [],
    recentApps: []
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20 });
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      let jobList = [];
      try {
        const result = await jobs.getMyList();
        jobList = Array.isArray(result) ? result : (result.list || result.rows || []);
      } catch (e) {
        console.log('jobs fallback:', e.message);
      }

      let recentApps = [];
      try {
        recentApps = await request({ url: '/api/v1/enterprise/applications' });
      } catch (e) {
        console.log('apps fallback:', e.message);
      }

      const applicants = recentApps.length;
      const uniqueCandidates = new Set();
      for (let i = 0; i < recentApps.length; i++) {
        uniqueCandidates.add(recentApps[i].user_name);
      }

      this.setData({
        stats: {
          jobs: jobList.length,
          online: jobList.filter(function(item) { return item.status === 'online'; }).length,
          applicants: applicants,
          candidates: uniqueCandidates.size
        },
        recentApps: recentApps.slice(0, 5),
        myJobs: jobList.slice(0, 5),
        loading: false
      });
    } catch (e) {
      console.error('加载企业数据失败:', e);
      this.setData({ loading: false });
    }
  },

  goPostJob() {
    wx.navigateTo({ url: '/pages/post-job/post-job' });
  },

  goJobs() {
    wx.switchTab({ url: '/pages/enterprise-jobs/enterprise-jobs' });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
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
  }
});
