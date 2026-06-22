/*
 * 轻量状态管理核心
 * 为所有 store 提供 get/set/subscribe 能力
 * 纯工具层——不含任何业务逻辑
 */

function createStore(name, initialState) {
  var state = initialState || {};
  var subscribers = [];

  function get(key) {
    if (key) return state[key];
    return state;
  }

  function set(key, value) {
    var oldVal = state[key];
    state[key] = value;
    notify(key, value, oldVal);
    return value;
  }

  function setAll(newState) {
    var keys = Object.keys(newState);
    for (var i = 0; i < keys.length; i++) {
      state[keys[i]] = newState[keys[i]];
    }
    notify('__all__', state, null);
    return state;
  }

  function subscribe(fn) {
    subscribers.push(fn);
    return function () {
      var idx = subscribers.indexOf(fn);
      if (idx !== -1) subscribers.splice(idx, 1);
    };
  }

  function notify(key, value, oldVal) {
    for (var i = 0; i < subscribers.length; i++) {
      try { subscribers[i](key, value, oldVal); } catch (e) {}
    }
  }

  return { get: get, set: set, setAll: setAll, subscribe: subscribe };
}

module.exports = { createStore: createStore };
