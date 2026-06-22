var { createStore } = require('./core');

var userStore = createStore('user', {
  id: null,
  phone: '',
  nickname: '',
  avatar: '',
  role: '',
  companyId: null,
  isLoggedIn: false
});

module.exports = userStore;
