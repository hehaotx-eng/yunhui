Component({
  options: {
    multipleSlots: true,
    addGlobalClass: true
  },

  properties: {
    item: { type: Object, value: {} },
    type: { type: String, value: 'job' }
  },

  data: {
    imageLoaded: false
  },

  methods: {
    onCardTap() {
      this.triggerEvent('tap', { id: this.properties.item.id || this.properties.item.job_id });
    },

    onCompanyTap(e) {
      const id = e.currentTarget.dataset.id;
      this.triggerEvent('company', { id });
    },

    onInteraction(e) {
      const action = e.currentTarget.dataset.action;
      this.triggerEvent('action', { action, id: this.properties.item.id || this.properties.item.job_id });
    },

    onImageLoad() {
      this.setData({ imageLoaded: true });
    },

    onImageError() {
      this.setData({ imageLoaded: false });
    }
  }
});
