/*
 * services/index.js — 业务编排层
 *
 * 职责：
 *   - 组合 API 调用 + domain 逻辑
 *   - 数据转换（轻量）
 *
 * 治理规则：
 *   ❌ 不得直接操作 storage / wx API
 *   ❌ 不得调用 modules
 *   ❌ 不得包含 UI 逻辑
 *   ✔ 只负责编排：API → domain → 返回
 */

var request = require('../api/request');

function toQuery(params) {
  if (!params) return '';
  var keys = Object.keys(params);
  if (keys.length === 0) return '';
  var qs = '?';
  for (var i = 0; i < keys.length; i++) {
    if (i > 0) qs += '&';
    qs += encodeURIComponent(keys[i]) + '=' + encodeURIComponent(params[keys[i]]);
  }
  return qs;
}

var services = {};

services.auth = {
  login: function (phone, password) {
    return request.post('/users/login', { phone: phone, password: password }, { needAuth: false });
  },
  register: function (data) {
    return request.post('/users/register', data, { needAuth: false });
  },
  getMe: function () {
    return request.get('/users/me');
  }
};

services.job = {
  getById: function (id) {
    return request.get('/jobs/' + id, null, { needAuth: false });
  },
  getAll: function (params) {
    return request.get('/jobs' + toQuery(params), null, { needAuth: false });
  },
  search: function (params) {
    return request.get('/jobs/search' + toQuery(params), null, { needAuth: false });
  },
  getMyList: function () {
    return request.get('/jobs/my/list');
  },
  create: function (data) {
    return request.post('/jobs', data);
  },
  update: function (id, data) {
    return request.put('/jobs/' + id, data);
  },
  remove: function (id) {
    return request.del('/jobs/' + id);
  },
  apply: function (jobId) {
    return request.post('/applications', { job_id: jobId });
  }
};

services.chat = {
  createConversation: function (targetUserId) {
    return request.post('/chat/conversations', { target_user_id: targetUserId });
  },
  getConversations: function () {
    return request.get('/chat/conversations');
  },
  sendMessage: function (conversationId, content, messageType) {
    return request.post('/chat/messages', { conversation_id: conversationId, content: content, message_type: messageType || 'text' });
  },
  getMessages: function (conversationId, params) {
    return request.get('/chat/messages/' + conversationId + toQuery(params || {}));
  },
  markRead: function (conversationId) {
    return request.put('/chat/conversations/' + conversationId + '/read');
  },
  getUnreadCount: function () {
    return request.get('/chat/unread/count');
  }
};

services.resume = {
  getById: function (id) {
    return request.get('/resumes/' + id);
  },
  getMyList: function () {
    return request.get('/resumes/me');
  },
  create: function (data) {
    return request.post('/resumes', data);
  },
  update: function (id, data) {
    return request.put('/resumes/' + id, data);
  },
  remove: function (id) {
    return request.del('/resumes/' + id);
  }
};

services.enterprise = {
  getResume: function (resumeId) {
    return request.get('/enterprise/resume/' + resumeId);
  },
  getCandidates: function (params) {
    return request.get('/enterprise/candidates' + toQuery(params || {}));
  },
  getFavorites: function () {
    return request.get('/enterprise/favorites');
  },
  toggleFavorite: function (resumeId) {
    return request.post('/enterprise/resume/' + resumeId + '/favorite');
  },
  checkFavorite: function (resumeId) {
    return request.get('/enterprise/resume/' + resumeId + '/favorite');
  },
  logCall: function (resumeId, phone) {
    return request.post('/enterprise/resume/' + resumeId + '/call', { phone: phone });
  }
};

services.favorites = {
  toggle: function (jobId) {
    return request.post('/favorites', { jobId: jobId });
  },
  getList: function () {
    return request.get('/favorites');
  },
  check: function (jobId) {
    return request.get('/favorites/check/' + jobId);
  }
};

module.exports = services;
