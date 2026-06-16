Component({
  properties: {
    job: { type: Object, value: {} },
    mode: { type: String, value: 'default' }
  },

  methods: {
    onTap() {
      this.triggerEvent('tap', { id: this.properties.job.id });
    }
  }
});
