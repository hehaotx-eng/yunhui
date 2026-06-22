/*
 * store/index.js — 状态管理统一出口
 *
 * 职责：
 *   - 聚合所有领域 store
 *   - 提供向后兼容的旧接口（get/set）
 *
 * 治理规则：
 *   ❌ store 之间禁止互相引用
 *   ❌ store 不能直接调用 API
 *   ❌ store 不能包含业务逻辑
 *   ✔ 每个 store 只负责单一领域
 */

var userStore = require('./userStore');
var appStore = require('./appStore');
var chatStore = require('./chatStore');
var feedStore = require('./feedStore');
var core = require('./core');

var stores = {
  user: userStore,
  app: appStore,
  chat: chatStore,
  feed: feedStore
};

module.exports = {
  get: function (storeName, key) {
    var s = stores[storeName];
    if (!s) return null;
    return key ? s.get(key) : s.get();
  },
  set: function (storeName, key, value) {
    var s = stores[storeName];
    if (s) s.set(key, value);
  },
  user: userStore,
  app: appStore,
  chat: chatStore,
  feed: feedStore,
  createStore: core.createStore
};
