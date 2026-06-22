/*
 * core/index.js — 微内核
 *
 * 职责：
 *   - 插件管理
 *   - 事件中心
 *   - 权限容器（不含业务权限定义）
 *
 * 治理规则：
 *   ❌ core 不得包含业务逻辑
 *   ❌ core 不得依赖 store / domain / services
 *   ✔ core 只提供基础设施能力
 */

var EventBus = require('./eventBus');
var PluginManager = require('./pluginManager');
var PermissionManager = require('./permission');

function Core() {
  this._events = new EventBus();
  this.plugins = new PluginManager(this);
  this.permission = new PermissionManager();
  this._initialized = false;
}

Core.prototype.init = function () {
  if (this._initialized) return this;
  this._initialized = true;
  this.emit('system:init');
  return this;
};

Core.prototype.on = function (event, fn) {
  return this._events.on(event, fn);
};

Core.prototype.once = function (event, fn) {
  return this._events.once(event, fn);
};

Core.prototype.emit = function (event) {
  var args = Array.prototype.slice.call(arguments);
  this._events.emit.apply(this._events, args);
  return this;
};

Core.prototype.off = function (event, fn) {
  this._events.off(event, fn);
  return this;
};

Core.prototype.use = function (plugin) {
  this.plugins.register(plugin);
  return this;
};

Core.prototype.start = function () {
  this.init();
  this.plugins.installAll();
  this.emit('system:start');
  return this;
};

var core = new Core();

module.exports = core;
