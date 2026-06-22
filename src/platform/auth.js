var store = require('../store/index');
var adapter = require('../adapter/index');

var PlatformAuth = {
  getToken: function() {
    return adapter.storage.get('token');
  },

  setToken: function(token) {
    adapter.storage.set('token', token);
  },

  getUser: function() {
    return adapter.storage.get('userInfo');
  },

  setUser: function(user) {
    adapter.storage.set('userInfo', user);
  },

  isLoggedIn: function() {
    return !!this.getToken();
  },

  isEnterprise: function() {
    var user = this.getUser();
    return !!(user && user.company_id);
  },

  getUserId: function() {
    var user = this.getUser();
    return user ? user.id : null;
  },

  logout: function() {
    adapter.storage.remove('token');
    adapter.storage.remove('userInfo');
  }
};

module.exports = PlatformAuth;
