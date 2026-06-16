module.exports = {
  createConversation(data = {}) {
    return {
      id: data.id || '',
      target_user_id: data.target_user_id || '',
      target_user_name: data.target_user_name || '',
      target_user_avatar: data.target_user_avatar || '',
      last_message: data.last_message || '',
      last_message_at: data.last_message_at || '',
      unread_count: data.unread_count || 0
    };
  },

  createMessage(data = {}) {
    return {
      id: data.id || '',
      conversation_id: data.conversation_id || '',
      sender_id: data.sender_id || '',
      content: data.content || '',
      created_at: data.created_at || ''
    };
  }
};
