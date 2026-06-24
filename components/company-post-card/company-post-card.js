Component({
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
    onTap() {
      this.triggerEvent('tap', { id: this.properties.item.id });
    },

    onCompanyTap() {
      this.triggerEvent('company', { id: this.properties.item.enterprise_id });
    },

    onAction(e) {
      this.triggerEvent('action', { action: e.currentTarget.dataset.action, id: this.properties.item.id });
    }
  }
});
