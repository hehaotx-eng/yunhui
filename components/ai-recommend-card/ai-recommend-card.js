Component({
  properties: {
    item: { type: Object, value: {} }
  },

  data: {
    scoreLevel: 'high',
    logoUrl: ''
  },

  observers: {
    'item.match_score'(val) {
      if (val >= 80) this.setData({ scoreLevel: 'high' });
      else if (val >= 60) this.setData({ scoreLevel: 'medium' });
      else this.setData({ scoreLevel: 'low' });
    },
    'item': function(item) {
      const raw = item.company_logo || item.enterprise_logo || '';
      const logoUrl = typeof raw === 'string' ? raw : (raw && raw.url ? raw.url : '');
      this.setData({ logoUrl: logoUrl });
    }
  },

  methods: {
    onTap() {
      this.triggerEvent('tap', { id: this.properties.item.job_id || this.properties.item.id });
    },

    onAction(e) {
      const action = e.currentTarget.dataset.action;
      this.triggerEvent('action', { action, id: this.properties.item.job_id || this.properties.item.id });
    },

    onCompanyTap(e) {
      const id = e.currentTarget.dataset.id;
      this.triggerEvent('company', { id });
    }
  }
});
