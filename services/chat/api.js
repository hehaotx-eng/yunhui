const { request, toQuery } = require('../core/request');

module.exports = {
  createConversation(targetUserId) {
    return request({ url: '/api/v1/chat/conversations', method: 'POST', data: { target_user_id: targetUserId } });
  },

  getConversations() {
    return request({ url: '/api/v1/chat/conversations' });
  },

  sendMessage(conversationId, content) {
    return request({ url: '/api/v1/chat/messages', method: 'POST', data: { conversation_id: conversationId, content } });
  },

  getMessages(conversationId, params = {}) {
    return request({ url: `/api/v1/chat/messages/${conversationId}${toQuery(params)}` });
  }
};
