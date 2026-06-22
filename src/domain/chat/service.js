var model = require('./model');
var entity = require('./entity');

var ChatService = {
  formatConversations: function(list) {
    return (list || []).map(function(d) { return entity.createConversation(d); });
  },

  formatMessages: function(list) {
    return (list || []).map(function(d) { return entity.createMessage(d); });
  },

  shouldShowTime: function(current, previous) {
    return model.shouldShowTimeSeparator(current, previous);
  },

  getUnreadTotal: function(conversations) {
    var total = 0;
    (conversations || []).forEach(function(c) { total += (c.unreadCount || c.unread_count || 0); });
    return total;
  }
};

module.exports = ChatService;
