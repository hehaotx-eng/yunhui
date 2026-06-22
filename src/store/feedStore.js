var { createStore } = require('./core');

var feedStore = createStore('feed', {
  jobs: [],
  feedList: [],
  currentPage: 1,
  hasMore: true,
  loading: false,
  filters: {}
});

module.exports = feedStore;
