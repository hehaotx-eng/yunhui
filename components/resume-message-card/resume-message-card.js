Component({
  properties: {
    resume: {
      type: Object,
      value: {}
    },
    status: {
      type: String,
      value: 'unread',
      options: ['read', 'unread']
    },
    messageId: {
      type: String,
      value: ''
    }
  },

  data: {},

  methods: {
    onViewResume() {
      const resumeId = this.properties.resume.id;
      if (resumeId) {
        wx.navigateTo({ url: '/pages/resume-preview/resume-preview?id=' + resumeId });
      }
      this.triggerEvent('view', { resumeId, messageId: this.properties.messageId });
    }
  }
});