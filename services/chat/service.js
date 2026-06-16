const chatApi = require('./api');
const { createConversation, createMessage } = require('./model');

module.exports = {
  async startChat(targetUserId) {
    if (!targetUserId) throw new Error('缺少目标用户');
    const data = await chatApi.createConversation(targetUserId);
    return createConversation(data);
  },

  async getConversationList() {
    const result = await chatApi.getConversations();
    const list = result.list || result.rows || result || [];
    return list.map(createConversation);
  },

  async sendTextMessage(conversationId, content) {
    if (!content || !content.trim()) throw new Error('消息内容不能为空');
    const data = await chatApi.sendMessage(conversationId, content.trim());
    return createMessage(data);
  },

  async getMessageList(conversationId, params) {
    const result = await chatApi.getMessages(conversationId, params);
    const list = Array.isArray(result) ? result : (result.list || result.rows || result || []);
    return list.map(createMessage);
  }
};
