/*
 * modules/user/index.js — 用户模块
 *
 * 依赖规则：
 *   ✔ services / store / adapter
 *   ❌ 不得调用其他 modules
 *   ❌ 不得直接调用 wx API
 */

var services = require('../../services/index');
var store = require('../../store/index');
var adapter = require('../../adapter/index');

var userModule = {
  login: function (phone, password) {
    return services.auth.login(phone, password).then(function (data) {
      if (data && data.token) adapter.storage.set('token', data.token);
      if (data && data.user) adapter.storage.set('userInfo', data.user);
      return data;
    });
  },

  register: function (data) {
    return services.auth.register(data);
  },

  logout: function () {
    adapter.storage.remove('token');
    adapter.storage.remove('userInfo');
  },

  getCurrentUser: function () {
    return adapter.storage.get('userInfo');
  },

  isLoggedIn: function () {
    return !!adapter.storage.get('token');
  },

  isEnterprise: function () {
    var user = adapter.storage.get('userInfo');
    return !!(user && user.company_id);
  }
};

module.exports = userModule;
