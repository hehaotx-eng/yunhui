/*
 * eventBus.js — 全局事件中心
 *
 * 职责：
 *   - 提供 on / emit / once / off 基础能力
 *   - 强制事件命名空间分类
 *
 * 治理规则：
 *   ✔ 事件必须按命名空间分类
 *   ✔ 事件只能用于：状态通知 / 生命周期同步 / 解耦通信
 *   ❌ 禁止 emit 无分类事件
 *   ❌ 禁止在 event handler 中写业务逻辑
 *   ❌ 禁止通过 event 跨模块乱调用
 *
 * 允许的命名空间：
 *   user:*        — 用户相关（login/logout/roleChange）
 *   chat:*        — 聊天相关（newMessage/unreadChange/conversationOpen）
 *   feed:*        — 信息流相关（beforeRender/build）
 *   system:*      — 系统相关（init/start）
 *   plugin:*      — 插件相关（installed/uninstalled）
 *   core:*        — 内核生命周期（保留）
 */

var VALID_NAMESPACES = ['user:', 'chat:', 'feed:', 'system:', 'plugin:', 'core:'];

function isValidEvent(event) {
  for (var i = 0; i < VALID_NAMESPACES.length; i++) {
    if (event.indexOf(VALID_NAMESPACES[i]) === 0) return true;
  }
  return false;
}

var EventBus = function () {
  this._events = {};
};

EventBus.prototype.on = function (event, fn) {
  if (!isValidEvent(event)) {
    console.warn('[EventBus] 非法事件名 "' + event + '" — 必须以 ' + VALID_NAMESPACES.join(', ') + ' 开头');
  }
  this._events[event] = this._events[event] || [];
  this._events[event].push(fn);
  return function () {
    var idx = (this._events[event] || []).indexOf(fn);
    if (idx !== -1) this._events[event].splice(idx, 1);
  }.bind(this);
};

EventBus.prototype.once = function (event, fn) {
  var wrapper = function () {
    fn.apply(this, arguments);
    this.off(event, wrapper);
  }.bind(this);
  return this.on(event, wrapper);
};

EventBus.prototype.emit = function (event) {
  if (!isValidEvent(event)) {
    console.warn('[EventBus] 非法事件名 "' + event + '" — 已被丢弃');
    return;
  }
  var args = Array.prototype.slice.call(arguments, 1);
  var handlers = this._events[event] || [];
  for (var i = 0; i < handlers.length; i++) {
    try { handlers[i].apply(null, args); } catch (e) { console.error('[EventBus]', event, e); }
  }
};

EventBus.prototype.off = function (event, fn) {
  if (!fn) { delete this._events[event]; return; }
  var handlers = this._events[event] || [];
  var idx = handlers.indexOf(fn);
  if (idx !== -1) handlers.splice(idx, 1);
};

EventBus.prototype.listenerCount = function (event) {
  return (this._events[event] || []).length;
};

EventBus.prototype.getValidNamespaces = function () {
  return VALID_NAMESPACES.slice();
};

module.exports = EventBus;
