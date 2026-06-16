Component({
  properties: {
    tags: { type: Array, value: [] },
    selected: { type: Array, value: [] },
    mode: { type: String, value: 'display' }
  },

  methods: {
    onTagTap(e) {
      const tag = e.currentTarget.dataset.tag;
      this.triggerEvent('select', { tag });
    }
  }
});
