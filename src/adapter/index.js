/*
 * adapter/index.js — 旧系统兼容适配层
 *
 * 职责：
 *   - 将旧代码的 wx.setStorageSync / getStorageSync 映射到新 store
 *   - 将旧代码的 getApp().globalData 映射到新 store
 *   - 提供图片路径兼容
 *
 * 治理规则：
 *   ❌ 不得包含业务逻辑
 *   ❌ 不得调用 domain / services / core
 *   ❌ 不得做数据计算或转换
 *   ✔ 仅做“字段映射”级别的兼容
 */

var store = require('../store/index');

var adapter = {};

adapter.storage = {
  get: function (key) {
    if (key === 'token') return store.app.get('token') || wx.getStorageSync('token') || '';
    if (key === 'userInfo') {
      var cached = store.user.get();
      if (cached && cached.id) return {
        id: cached.id, phone: cached.phone, nickname: cached.nickname,
        avatar: cached.avatar, role: cached.role, company_id: cached.companyId
      };
      return wx.getStorageSync('userInfo') || null;
    }
    return wx.getStorageSync(key);
  },

  set: function (key, value) {
    if (key === 'token') store.app.set('token', value);
    if (key === 'userInfo' && value) {
      store.user.set('id', value.id);
      store.user.set('phone', value.phone || '');
      store.user.set('nickname', value.nickname || '');
      store.user.set('avatar', value.avatar || '');
      store.user.set('role', value.role || '');
      store.user.set('companyId', value.company_id || null);
      store.user.set('isLoggedIn', !!value.id);
    }
    wx.setStorageSync(key, value);
  },

  remove: function (key) {
    if (key === 'token') { store.app.set('token', null); store.user.set('isLoggedIn', false); }
    if (key === 'userInfo') {
      store.user.setAll({ id: null, phone: '', nickname: '', avatar: '', role: '', companyId: null, isLoggedIn: false });
    }
    wx.removeStorageSync(key);
  }
};

adapter.globalData = {
  get: function () {
    return {
      token: store.app.get('token'),
      userInfo: {
        id: store.user.get('id'), phone: store.user.get('phone'),
        nickname: store.user.get('nickname'), avatar: store.user.get('avatar'),
        company_id: store.user.get('companyId')
      },
      isEnterprise: store.app.get('isEnterprise'),
      isUser: store.app.get('isUser'),
      unreadCount: store.app.get('unreadCount')
    };
  },

  sync: function () {
    var app = typeof getApp === 'function' ? getApp() : null;
    if (!app || !app.globalData) return;
    var gd = app.globalData;
    if (gd.token) adapter.storage.set('token', gd.token);
    if (gd.userInfo) adapter.storage.set('userInfo', gd.userInfo);
  }
};

adapter.resolveImage = function (url) {
  if (!url || url.indexOf('http') === 0) return url;
  var { BASE_URL } = require('../../config/base');
  if (url.indexOf('/uploads/') === 0 || url.indexOf('/images/') === 0) return BASE_URL + url;
  return url;
};

module.exports = adapter;
