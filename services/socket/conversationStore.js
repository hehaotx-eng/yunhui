var messageCenter = require('./messageCenter');

var conversations = [];
var listeners = [];
var lastUpdateTime = 0;
var notifyTimer = null;
var notifyDelay = 100;
var pendingNotify = false;
var MAX_CONVERSATIONS = 200;

function getConversations() {
  return conversations;
}

function updateConversation(data) {
  var id = data.conversation_id || data.id;
  if (!id) {
    return;
  }

  var index = -1;
  for (var i = 0; i < conversations.length; i++) {
    if (conversations[i].id === id) {
      index = i;
      break;
    }
  }

  if (index !== -1) {
    var conv = conversations[index];
    if (data.lastMessage !== undefined) {
      conv.lastMessage = data.lastMessage;
    }
    if (data.lastTime !== undefined) {
      conv.lastTime = data.lastTime;
    }
    if (data.unreadCount !== undefined) {
      conv.unreadCount = data.unreadCount;
    } else if (data.incrementUnread) {
      conv.unreadCount = (conv.unreadCount || 0) + 1;
    }
    if (data.avatar || data.avatar_url || data.target_user_avatar) {
      conv.avatar = data.avatar || data.avatar_url || data.target_user_avatar;
      conv.target_user_avatar = conv.avatar;
    }
    if (data.company_logo) {
      conv.company_logo = data.company_logo;
    }
    if (data.user_avatar) {
      conv.user_avatar = data.user_avatar;
    }
    if (data.name) {
      conv.name = data.name;
    }
    if (index > 0) {
      conversations.splice(index, 1);
      conversations.unshift(conv);
    }
  } else {
    var newConv = {
      id: id,
      name: data.name || '',
      avatar: data.avatar || data.avatar_url || data.target_user_avatar || '',
      target_user_avatar: data.target_user_avatar || data.avatar || data.avatar_url || '',
      company_logo: data.company_logo || '',
      user_avatar: data.user_avatar || '',
      lastMessage: data.lastMessage || '',
      lastTime: data.lastTime || new Date().toISOString(),
      unreadCount: data.unreadCount || 1,
      userId: data.userId || ''
    };
    conversations.unshift(newConv);
  }

  _trimConversations();
  _notify();
}

function markAsRead(conversationId) {
  for (var i = 0; i < conversations.length; i++) {
    if (conversations[i].id === conversationId) {
      conversations[i].unreadCount = 0;
      break;
    }
  }
  _notify();
}

function removeConversation(conversationId) {
  conversations = conversations.filter(function (c) {
    return c.id !== conversationId;
  });
  _notify();
}

function getTotalUnread() {
  var total = 0;
  for (var i = 0; i < conversations.length; i++) {
    total += (conversations[i].unreadCount || 0);
  }
  return total;
}

function setConversations(list) {
  conversations = Array.isArray(list) ? list : [];
  _trimConversations();
  _notify();
}

function subscribe(callback) {
  listeners.push(callback);
}

function unsubscribe(callback) {
  listeners = listeners.filter(function (cb) {
    return cb !== callback;
  });
}

function _notify() {
  var now = Date.now();
  var diff = now - lastUpdateTime;

  if (diff < notifyDelay) {
    if (!pendingNotify) {
      pendingNotify = true;
      notifyTimer = setTimeout(function () {
        pendingNotify = false;
        lastUpdateTime = Date.now();
        _doNotify();
      }, notifyDelay - diff);
    }
    return;
  }

  lastUpdateTime = now;
  _doNotify();
}

function _doNotify() {
  for (var i = 0; i < listeners.length; i++) {
    try {
      listeners[i](conversations);
    } catch (e) {}
  }
}

function _trimConversations() {
  if (conversations.length > MAX_CONVERSATIONS) {
    conversations = conversations.slice(0, MAX_CONVERSATIONS);
  }
}

messageCenter.on('NEW_MESSAGE', function (data) {
  updateConversation({
    conversation_id: data.conversation_id,
    lastMessage: data.content || '',
    lastTime: data.created_at || new Date().toISOString(),
    incrementUnread: true,
    name: data.sender_name || '',
    avatar: data.sender_avatar || '',
    userId: data.sender_id || ''
  });
});

messageCenter.on('READ_MESSAGE', function (data) {
  if (data.conversation_id) {
    markAsRead(data.conversation_id);
  }
});

messageCenter.on('DELETE_MESSAGE', function (data) {
  if (data.conversation_id) {
    removeConversation(data.conversation_id);
  }
});

messageCenter.on('CONVERSATION_UPDATE', function (data) {
  updateConversation(data);
});

module.exports = {
  getConversations: getConversations,
  updateConversation: updateConversation,
  markAsRead: markAsRead,
  removeConversation: removeConversation,
  getTotalUnread: getTotalUnread,
  setConversations: setConversations,
  subscribe: subscribe,
  unsubscribe: unsubscribe
};
