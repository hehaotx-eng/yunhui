var { BASE_URL } = require('../../config/base');
var messageCenter = require('./messageCenter');

var WS_URL = BASE_URL.replace('http', 'ws') + '/ws';

var STATE = {
  IDLE: 'IDLE',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  RECONNECTING: 'RECONNECTING',
  CLOSED: 'CLOSED'
};

var state = STATE.IDLE;
var socketTask = null;
var reconnectCount = 0;
var maxReconnect = 10;
var reconnectTimer = null;
var reconnectLock = false;
var listeners = {};
var disabled = false;
var failCount = 0;
var MAX_FAIL_COUNT = 3;

var heartbeatTimer = null;
var lastHeartbeat = 0;
var heartbeatTimeout = 90000;
var heartbeatInterval = 30000;
var heartbeatPaused = false;

var lastMessageTime = null;

var SUPPORTED_TYPES = [
  'NEW_MESSAGE',
  'READ_MESSAGE',
  'DELETE_MESSAGE',
  'TYPING',
  'ONLINE',
  'OFFLINE',
  'UNREAD_COUNT',
  'CONVERSATION_UPDATE',
  'ACK'
];

function _setState(newState) {
  if (state !== newState) {
    state = newState;
    _trigger('stateChange', { state: newState });
  }
}

function getState() {
  return state;
}

function isDisabled() {
  return disabled;
}

function connect() {
  if (disabled) return;
  if (state === STATE.CONNECTED || state === STATE.CONNECTING) {
    return;
  }

  var token = '';
  try {
    token = wx.getStorageSync('token') || '';
  } catch (e) {}

  if (!token) {
    return;
  }

  _setState(STATE.CONNECTING);

  socketTask = wx.connectSocket({
    url: WS_URL + '?token=' + token,
    success: function () {},
    fail: function () {
      _setState(STATE.RECONNECTING);
      _trigger('error', { message: '连接失败' });
      _scheduleReconnect();
    }
  });

  socketTask.onOpen(function () {
    _setState(STATE.CONNECTED);
    reconnectCount = 0;
    failCount = 0;
    disabled = false;
    lastHeartbeat = Date.now();
    if (!heartbeatPaused) {
      _startHeartbeat();
    }
    _trigger('open', {});
    _syncOfflineMessages();
  });

  socketTask.onClose(function (res) {
    _stopHeartbeat();

    if (res && res.code === 1006) {
      failCount++;
      if (failCount >= MAX_FAIL_COUNT) {
        disabled = true;
        _setState(STATE.CLOSED);
        _trigger('error', { message: 'WebSocket 404，已自动熔断' });
        return;
      }
    }

    _setState(STATE.RECONNECTING);
    _trigger('close', {});
    _scheduleReconnect();
  });

  socketTask.onError(function (res) {
    _stopHeartbeat();
    failCount++;

    if (failCount >= MAX_FAIL_COUNT) {
      disabled = true;
      _setState(STATE.CLOSED);
      _trigger('error', { message: 'WebSocket 连续失败，已自动熔断' });
      return;
    }

    _setState(STATE.RECONNECTING);
    _trigger('error', res);
  });

  socketTask.onMessage(function (res) {
    var data = null;
    try {
      data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
    } catch (e) {
      data = res.data;
    }

    if (data && data.type === 'PONG') {
      lastHeartbeat = Date.now();
      return;
    }

    _trigger('message', data);

    if (data && data.type && SUPPORTED_TYPES.indexOf(data.type) !== -1) {
      messageCenter.emit(data.type, data);
    }

    if (data && data.created_at) {
      lastMessageTime = data.created_at;
    }
  });
}

function disconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  _stopHeartbeat();
  reconnectCount = maxReconnect;
  if (socketTask) {
    socketTask.close({});
    socketTask = null;
  }
  _setState(STATE.CLOSED);
}

function send(data) {
  if (state !== STATE.CONNECTED || !socketTask) {
    return false;
  }
  var msg = typeof data === 'string' ? data : JSON.stringify(data);
  socketTask.send({ data: msg });
  return true;
}

function pauseHeartbeat() {
  heartbeatPaused = true;
  _stopHeartbeat();
}

function resumeHeartbeat() {
  heartbeatPaused = false;
  if (state === STATE.CONNECTED) {
    lastHeartbeat = Date.now();
    _startHeartbeat();
  }
}

function reconnect() {
  if (reconnectLock) return;
  reconnectLock = true;
  setTimeout(function () { reconnectLock = false; }, 5000);

  if (state === STATE.CONNECTED || state === STATE.CONNECTING) {
    return;
  }

  _setState(STATE.RECONNECTING);
  connect();
}

function _syncOfflineMessages() {
  // 离线消息恢复由服务器主动推送
}

function _startHeartbeat() {
  _stopHeartbeat();
  heartbeatTimer = setInterval(function () {
    if (state !== STATE.CONNECTED) {
      _stopHeartbeat();
      return;
    }

    if (Date.now() - lastHeartbeat > heartbeatTimeout) {
      _stopHeartbeat();
      if (socketTask) {
        socketTask.close({});
        socketTask = null;
      }
      _setState(STATE.RECONNECTING);
      _scheduleReconnect();
      return;
    }

    send({ type: 'PING' });
  }, heartbeatInterval);
}

function _stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

function _scheduleReconnect() {
  if (reconnectCount >= maxReconnect) {
    _setState(STATE.CLOSED);
    return;
  }
  if (reconnectTimer) {
    return;
  }
  _setState(STATE.RECONNECTING);
  reconnectTimer = setTimeout(function () {
    reconnectTimer = null;
    reconnectCount++;
    connect();
  }, 5000);
}

function on(event, callback) {
  if (!listeners[event]) {
    listeners[event] = [];
  }
  listeners[event].push(callback);
}

function off(event, callback) {
  if (!listeners[event]) {
    return;
  }
  if (!callback) {
    listeners[event] = [];
    return;
  }
  listeners[event] = listeners[event].filter(function (cb) {
    return cb !== callback;
  });
}

function _trigger(event, data) {
  var cbs = listeners[event] || [];
  for (var i = 0; i < cbs.length; i++) {
    try {
      cbs[i](data);
    } catch (e) {}
  }
}

function getLastMessageTime() {
  return lastMessageTime;
}

module.exports = {
  connect: connect,
  disconnect: disconnect,
  send: send,
  on: on,
  off: off,
  reconnect: reconnect,
  pauseHeartbeat: pauseHeartbeat,
  resumeHeartbeat: resumeHeartbeat,
  getState: getState,
  isDisabled: isDisabled,
  getLastMessageTime: getLastMessageTime,
  STATE: STATE
};
