Component({
  properties: {
    job: { type: Object, value: {} },
    mode: { type: String, value: 'default' }
  },

  data: {
    logoUrl: ''
  },

  observers: {
    'job': function(job) {
      const raw = job.company_logo || job.logo || '';
      const logoUrl = typeof raw === 'string' ? raw : (raw && raw.url ? raw.url : '');
      this.setData({ logoUrl: logoUrl });
    }
  },

  methods: {
    onTap() {
      this.triggerEvent('tap', { id: this.properties.job.id });
    }
  }
});
