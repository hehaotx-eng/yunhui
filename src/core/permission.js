var PermissionManager = function() {
  this._rules = {};
};

PermissionManager.prototype.define = function(name, checkFn) {
  this._rules[name] = checkFn;
  return this;
};

PermissionManager.prototype.check = function(name, context) {
  var fn = this._rules[name];
  if (!fn) return false;
  try { return !!fn(context); } catch (e) { return false; }
};

PermissionManager.prototype.can = function(name, context) {
  return this.check(name, context);
};

PermissionManager.prototype.batchCheck = function(names, context) {
  var result = {};
  for (var i = 0; i < names.length; i++) {
    result[names[i]] = this.check(names[i], context);
  }
  return result;
};

module.exports = PermissionManager;
