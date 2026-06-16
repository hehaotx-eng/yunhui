Component({
  options: { addGlobalClass: true },

  properties: {
    categories: { type: Array, value: [] },
    activeKey: { type: String, value: 'all' }
  },

  data: {
    indicatorX: 0,
    indicatorWidth: 0,
    items: [],
    scrollLeft: 0,
    animating: false
  },

  lifetimes: {
    ready() {
      setTimeout(() => this.measureItems(), 150);
    }
  },

  observers: {
    'categories'() {
      setTimeout(() => this.measureItems(), 100);
    },
    'activeKey'(key) {
      this.snapToKey(key);
    }
  },

  methods: {
    measureItems() {
      const query = this.createSelectorQuery();
      query.selectAll('.tab-item').boundingClientRect();
      query.select('.tab-scroll').boundingClientRect();
      query.exec((res) => {
        if (!res || !res[0] || !res[1]) return;
        const containerLeft = res[1].left;
        const rects = res[0];
        const items = rects.map((r, i) => ({
          index: i,
          left: r.left - containerLeft,
          width: r.width,
          key: this.properties.categories[i]?.key
        }));
        this.setData({ items, _containerLeft: containerLeft }, () => {
          this.snapToKey(this.properties.activeKey);
        });
      });
    },

    snapToKey(key) {
      if (!this.data.items.length) return;
      const item = this.data.items.find(i => i.key === key);
      if (!item) return;
      this.setData({
        indicatorX: item.left,
        indicatorWidth: item.width
      });
    },

    onItemTap(e) {
      const key = e.currentTarget.dataset.key;
      this.setData({ activeKey: key, animating: true });
      this.triggerEvent('change', { key });
    }
  }
});
