/*
 * modules/enterprise/index.js — 企业模块
 *
 * 依赖规则：
 *   ✔ services / store
 *   ❌ 不得调用其他 modules
 *   ❌ 不得直接调用 wx API
 */

var services = require('../../services/index');

var enterpriseModule = {
  getResume: function (resumeId) {
    return services.enterprise.getResume(resumeId);
  },

  getCandidates: function (params) {
    return services.enterprise.getCandidates(params);
  },

  getFavorites: function () {
    return services.enterprise.getFavorites();
  },

  toggleFavorite: function (resumeId) {
    return services.enterprise.toggleFavorite(resumeId);
  },

  checkFavorite: function (resumeId) {
    return services.enterprise.checkFavorite(resumeId);
  },

  logCall: function (resumeId, phone) {
    return services.enterprise.logCall(resumeId, phone);
  },

  startChatWithCandidate: function (userId) {
    return services.chat.createConversation(userId);
  }
};

module.exports = enterpriseModule;
