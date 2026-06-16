Component({
  properties: {
    info: { type: Object, value: {} },
    type: { type: String, value: 'company' },
    isOwner: { type: Boolean, value: false }
  },

  methods: {
    onFollow() {
      this.triggerEvent('follow');
    },

    onChat() {
      this.triggerEvent('chat');
    },

    onShare() {
      this.triggerEvent('share');
    }
  }
});
