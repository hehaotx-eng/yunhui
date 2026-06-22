var { createStore } = require('./core');

var appStore = createStore('app', {
  token: null,
  isEnterprise: false,
  isUser: true,
  unreadCount: 0,
  statusBarHeight: 20,
  networkType: 'wifi'
});

module.exports = appStore;
