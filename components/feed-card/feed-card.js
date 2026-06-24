Component({
  options: { addGlobalClass: true },

  properties: {
    item: { type: Object, value: {} }
  },

  data: {
    logoUrl: ''
  },

  observers: {
    'item': function(item) {
      const raw = item.company_logo || item.enterprise_logo || '';
      const logoUrl = typeof raw === 'string' ? raw : (raw && raw.url ? raw.url : '');
      this.setData({ logoUrl: logoUrl });
    }
  },

  methods: {
    onCardTap() {
      this.triggerEvent('tap', { id: this.properties.item.job_id || this.properties.item.id });
    },

    onCompanyTap(e) {
      const id = e.currentTarget.dataset.id;
      this.triggerEvent('company', { id });
    },

    onAction(e) {
      const action = e.currentTarget.dataset.action;
      this.triggerEvent('action', { action, id: this.properties.item.job_id || this.properties.item.id });
    },


  }
});
