Component({
  properties: {
    info: { type: Object, value: {} },
    type: { type: String, value: 'company' },
    isOwner: { type: Boolean, value: false }
  },

  data: {
    avatarUrl: ''
  },

  observers: {
    'info': function(info) {
      const raw = info.logo || info.avatar || '';
      const avatarUrl = typeof raw === 'string' ? raw : (raw && raw.url ? raw.url : '');
      this.setData({ avatarUrl: avatarUrl });
    }
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
