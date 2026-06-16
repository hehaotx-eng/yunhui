Component({
  properties: {
    item: { type: Object, value: {} }
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
