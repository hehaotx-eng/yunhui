var { createStore } = require('./core');

var chatStore = createStore('chat', {
  conversations: [],
  currentConversationId: '',
  unreadCount: 0
});

module.exports = chatStore;
