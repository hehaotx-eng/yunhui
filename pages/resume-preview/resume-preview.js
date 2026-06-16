const { resumes, request } = require('../../utils/api');

Page({
  data: {
    resumeId: null,
    resume: null,
    loading: true,
    from: ''
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ resumeId: options.id, from: options.from || '' });
      this.loadResume(options.id, options.from);
    }
  },

  async loadResume(id, from) {
    this.setData({ loading: true });
    try {
      var data;
      if (from === 'enterprise') {
        data = await request({ url: '/api/v1/enterprise/resume/' + id });
      } else {
        data = await resumes.getById(id);
      }
      this.setData({ resume: data, loading: false });
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  goEdit() {
    wx.navigateTo({ url: '/pages/create-resume/create-resume?id=' + this.data.resumeId });
  }
});
