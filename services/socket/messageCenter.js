var events = {};

var SUPPORTED_EVENTS = [
  'NEW_MESSAGE',
  'READ_MESSAGE',
  'DELETE_MESSAGE',
  'TYPING',
  'ONLINE',
  'OFFLINE',
  'UNREAD_COUNT',
  'CONVERSATION_UPDATE',
  'ACK',
  'SYNC_OFFLINE'
];

var MAX_LISTENERS = 50;

function _isValidEvent(event) {
  return SUPPORTED_EVENTS.indexOf(event) !== -1;
}

function _checkListenerCount() {
  var total = 0;
  var keys = Object.keys(events);
  for (var i = 0; i < keys.length; i++) {
    total += (events[keys[i]] || []).length;
  }
  if (total > MAX_LISTENERS) {
    console.warn('[messageCenter] 监听器数量过多:', total, '可能存在泄漏');
  }
}

function emit(event, data) {
  if (!_isValidEvent(event)) {
    return;
  }
  var cbs = events[event] || [];
  for (var i = 0; i < cbs.length; i++) {
    try {
      cbs[i](data);
    } catch (e) {}
  }
}

function on(event, callback) {
  if (!_isValidEvent(event)) {
    return;
  }
  if (!events[event]) {
    events[event] = [];
  }
  events[event].push(callback);
  _checkListenerCount();
}

function off(event, callback) {
  if (!events[event]) {
    return;
  }
  if (!callback) {
    events[event] = [];
    return;
  }
  events[event] = events[event].filter(function (cb) {
    return cb !== callback;
  });
}

function once(event, callback) {
  if (!_isValidEvent(event)) {
    return;
  }
  var wrapper = function (data) {
    off(event, wrapper);
    callback(data);
  };
  on(event, wrapper);
}

function listenerCount() {
  var total = 0;
  var keys = Object.keys(events);
  for (var i = 0; i < keys.length; i++) {
    total += (events[keys[i]] || []).length;
  }
  return total;
}

module.exports = {
  emit: emit,
  on: on,
  off: off,
  once: once,
  listenerCount: listenerCount
};
