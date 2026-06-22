function ConversationEntity(data) {
  this.id = data.id || null;
  this.user1Id = data.user1_id || null;
  this.user2Id = data.user2_id || null;
  this.companyId = data.company_id || null;
  this.otherName = data.other_name || data.otherName || '';
  this.otherAvatar = data.target_user_avatar || data.otherAvatar || '';
  this.lastMessage = data.last_message || '';
  this.lastMessageAt = data.last_message_at || '';
  this.unreadCount = data.unread_count || 0;
  this.updatedAt = data.updated_at || '';
}

ConversationEntity.prototype.hasUnread = function() { return this.unreadCount > 0; };

function MessageEntity(data) {
  this.id = data.id || null;
  this.conversationId = data.conversation_id || null;
  this.senderId = data.sender_id || null;
  this.content = data.content || '';
  this.messageType = data.message_type || 'text';
  this.nickname = data.nickname || '';
  this.senderAvatar = data.sender_avatar || '';
  this.createdAt = data.created_at || '';
}

MessageEntity.prototype.isMine = function(myUserId) { return String(this.senderId) === String(myUserId); };
MessageEntity.prototype.isJobMessage = function() { return this.messageType === 'job'; };

function createConversation(d) { return new ConversationEntity(d || {}); }
function createMessage(d) { return new MessageEntity(d || {}); }

module.exports = { ConversationEntity: ConversationEntity, MessageEntity: MessageEntity, createConversation: createConversation, createMessage: createMessage };
