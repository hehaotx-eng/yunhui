var request = require('./request');
var apis = {};

apis.auth = {
  login: function(phone, password) {
    return request.post('/users/login', { phone: phone, password: password }, { needAuth: false });
  },
  register: function(data) {
    return request.post('/users/register', data, { needAuth: false });
  },
  getMe: function() {
    return request.get('/users/me');
  },
  updateProfile: function(data) {
    return request.put('/users/profile', data);
  }
};

apis.jobs = {
  getAll: function(params) {
    return request.get('/jobs' + toQuery(params), null, { needAuth: false });
  },
  getById: function(id) {
    return request.get('/jobs/' + id, null, { needAuth: false });
  },
  search: function(params) {
    return request.get('/jobs/search' + toQuery(params), null, { needAuth: false });
  },
  getMyList: function() {
    return request.get('/jobs/my/list');
  },
  create: function(data) {
    return request.post('/jobs', data);
  },
  update: function(id, data) {
    return request.put('/jobs/' + id, data);
  },
  remove: function(id) {
    return request.del('/jobs/' + id);
  }
};

apis.chat = {
  createConversation: function(targetUserId) {
    return request.post('/chat/conversations', { target_user_id: targetUserId });
  },
  getConversations: function() {
    return request.get('/chat/conversations');
  },
  sendMessage: function(conversationId, content, messageType) {
    return request.post('/chat/messages', { conversation_id: conversationId, content: content, message_type: messageType || 'text' });
  },
  getMessages: function(conversationId, params) {
    return request.get('/chat/messages/' + conversationId + toQuery(params || {}));
  },
  markRead: function(conversationId) {
    return request.put('/chat/conversations/' + conversationId + '/read');
  },
  getUnreadCount: function() {
    return request.get('/chat/unread/count');
  }
};

apis.resumes = {
  getById: function(id) {
    return request.get('/resumes/' + id);
  },
  getMyList: function() {
    return request.get('/resumes/me');
  },
  create: function(data) {
    return request.post('/resumes', data);
  },
  update: function(id, data) {
    return request.put('/resumes/' + id, data);
  },
  remove: function(id) {
    return request.del('/resumes/' + id);
  }
};

apis.enterprise = {
  getResume: function(resumeId) {
    return request.get('/enterprise/resume/' + resumeId);
  },
  getCandidates: function(params) {
    return request.get('/enterprise/candidates' + toQuery(params || {}));
  },
  getFavorites: function() {
    return request.get('/enterprise/favorites');
  },
  toggleFavorite: function(resumeId) {
    return request.post('/enterprise/resume/' + resumeId + '/favorite');
  },
  checkFavorite: function(resumeId) {
    return request.get('/enterprise/resume/' + resumeId + '/favorite');
  },
  logCall: function(resumeId, phone) {
    return request.post('/enterprise/resume/' + resumeId + '/call', { phone: phone });
  }
};

apis.favorites = {
  toggle: function(jobId) {
    return request.post('/favorites', { jobId: jobId });
  },
  getList: function() {
    return request.get('/favorites');
  },
  check: function(jobId) {
    return request.get('/favorites/check/' + jobId);
  }
};

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

module.exports = {
  request: request,
  auth: apis.auth,
  jobs: apis.jobs,
  chat: apis.chat,
  resumes: apis.resumes,
  enterprise: apis.enterprise,
  favorites: apis.favorites
};
