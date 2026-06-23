Component({
  properties: {
    job: {
      type: Object,
      value: {}
    },
    isApplied: {
      type: Boolean,
      value: false
    }
  },

  data: {},

  methods: {
    onViewDetail() {
      const jobId = this.properties.job.id;
      if (jobId) {
        wx.navigateTo({ url: '/pages/detail/detail?id=' + jobId });
      }
      this.triggerEvent('viewDetail', { jobId });
    },

    onApply() {
      if (this.properties.isApplied) return;
      this.setData({ isApplied: true });
      this.triggerEvent('apply', { jobId: this.properties.job.id });
    }
  }
});