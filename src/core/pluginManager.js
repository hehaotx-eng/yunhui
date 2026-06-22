var PluginManager = function(core) {
  this._core = core;
  this._plugins = {};
  this._installed = [];
};

PluginManager.prototype.register = function(plugin) {
  if (!plugin || !plugin.name) throw new Error('Plugin must have a name');
  if (this._plugins[plugin.name]) throw new Error('Plugin "' + plugin.name + '" already registered');
  this._plugins[plugin.name] = plugin;
  return this;
};

PluginManager.prototype.install = function(name) {
  var plugin = this._plugins[name];
  if (!plugin) throw new Error('Plugin "' + name + '" not found');
  if (this._installed.indexOf(name) !== -1) return this;
  if (typeof plugin.install === 'function') {
    plugin.install(this._core);
  }
  this._installed.push(name);
  this._core.emit('plugin:installed', { name: name, plugin: plugin });
  return this;
};

PluginManager.prototype.installAll = function() {
  var names = Object.keys(this._plugins);
  for (var i = 0; i < names.length; i++) {
    this.install(names[i]);
  }
  return this;
};

PluginManager.prototype.uninstall = function(name) {
  var idx = this._installed.indexOf(name);
  if (idx === -1) return this;
  var plugin = this._plugins[name];
  if (typeof plugin.uninstall === 'function') {
    plugin.uninstall(this._core);
  }
  this._installed.splice(idx, 1);
  this._core.emit('plugin:uninstalled', { name: name });
  return this;
};

PluginManager.prototype.isInstalled = function(name) {
  return this._installed.indexOf(name) !== -1;
};

PluginManager.prototype.getInstalled = function() {
  return this._installed.slice();
};

module.exports = PluginManager;
