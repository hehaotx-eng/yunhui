Component({
  options: { multipleSlots: true },

  properties: {
    loading: { type: Boolean, value: true },
    rows: { type: Number, value: 3 }
  },

  data: {
    rowsArr: [1, 2, 3]
  },

  observers: {
    rows(val) {
      this.setData({ rowsArr: Array.from({ length: val }, (_, i) => i + 1) });
    }
  }
});
