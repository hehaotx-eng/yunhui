/*
 * modules/chat/index.js — 聊天模块
 *
 * 依赖规则：
 *   ✔ services / store
 *   ❌ 不得调用其他 modules
 *   ❌ 不得直接调用 wx API
 */

var services = require('../../services/index');
var store = require('../../store/index');

var chatModule = {
  getConversations: function () {
    return services.chat.getConversations().then(function (list) {
      store.chat.set('conversations', list);
      return list;
    });
  },

  sendMessage: function (conversationId, content, messageType) {
    return services.chat.sendMessage(conversationId, content, messageType);
  },

  getMessages: function (conversationId, params) {
    return services.chat.getMessages(conversationId, params);
  },

  markAsRead: function (conversationId) {
    return services.chat.markRead(conversationId);
  },

  getUnreadCount: function () {
    return services.chat.getUnreadCount().then(function (data) {
      store.app.set('unreadCount', data.count || 0);
      return data;
    });
  },

  createConversation: function (targetUserId) {
    return services.chat.createConversation(targetUserId);
  }
};

module.exports = chatModule;
