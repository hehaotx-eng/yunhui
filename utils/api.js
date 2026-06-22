const { BASE_URL } = require('../config/base');
const cache = require('./cache');

function getToken() {
  try { return wx.getStorageSync('token') || ''; } catch (e) { return ''; }
}

function setToken(token) {
  try { wx.setStorageSync('token', token); } catch (e) {}
}

function setUserInfo(user) {
  try { wx.setStorageSync('userInfo', user); } catch (e) {}
}

function clearAuth() {
  try {
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
    cache.clearAllCache();
  } catch (e) {}
}

function request(options) {
  const { url, method = 'GET', data = {}, header = {}, needAuth = true } = options;
  const finalHeader = Object.assign({ 'Content-Type': 'application/json' }, header);

  if (needAuth) {
    const token = getToken();
    if (token) {
      finalHeader.Authorization = `Bearer ${token}`;
    }
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header: finalHeader,
      success: (res) => {
        if (res.statusCode === 401) {
          if (needAuth) {
            clearAuth();
            reject(new Error('登录已失效，请重新登录'));
          } else {
            reject(new Error('需要登录'));
          }
          return;
        }
        if (res.statusCode === 403) {
          reject(new Error('权限不足'));
          return;
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const body = res.data || {};
          if (body.code === 0 || body.code === 200) {
            resolve(body.data);
          } else {
            reject(new Error(body.message || '请求失败'));
          }
          return;
        }
        reject(new Error((res.data && res.data.message) || `服务异常 ${res.statusCode}`));
      },
      fail: () => reject(new Error('网络请求失败'))
    });
  });
}

function uploadFile(filePath, type, extra = {}) {
  return new Promise((resolve, reject) => {
    const token = getToken();
    const formData = { type };
    Object.assign(formData, extra);

    wx.uploadFile({
      url: `${BASE_URL}/api/v1/upload/image`,
      filePath,
      name: 'file',
      formData,
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success: (res) => {
        try {
          const data = JSON.parse(res.data);
          if (data.code === 0 || data.code === 200) {
            resolve(data.data);
          } else {
            reject(new Error(data.message || '上传失败'));
          }
        } catch {
          reject(new Error('解析响应失败'));
        }
      },
      fail: () => reject(new Error('上传失败'))
    });
  });
}

function toQuery(params = {}) {
  const query = Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== null && params[key] !== '')
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  return query ? `?${query}` : '';
}

function saveLogin(data) {
  if (data && data.token) setToken(data.token);
  return data;
}

// ========== 用户 ==========
const auth = {
  login(phone, password) {
    cache.clearAllCache();
    return request({ url: '/api/v1/users/login', method: 'POST', data: { phone, password }, needAuth: false }).then(saveLogin);
  },
  register(data) {
    return request({ url: '/api/v1/users/register', method: 'POST', data, needAuth: false });
  },
  getMe() {
    return cache.cachedFetch('user_me', function() {
      return request({ url: '/api/v1/users/me' });
    }, 5 * 60 * 1000);
  },
  updateProfile(data) {
    cache.removeCache('user_me');
    return request({ url: '/api/v1/users/profile', method: 'PUT', data });
  }
};

// ========== 职位 ==========
const jobs = {
  getAll(params = {}) {
    return request({ url: `/api/v1/jobs${toQuery(params)}`, needAuth: false });
  },
  getById(id) {
    return request({ url: `/api/v1/jobs/${id}`, needAuth: false });
  },
  getMyList() {
    return request({ url: '/api/v1/jobs/my/list' });
  },
  create(data) {
    return request({ url: '/api/v1/jobs', method: 'POST', data });
  },
  update(id, data) {
    return request({ url: `/api/v1/jobs/${id}`, method: 'PUT', data });
  },
  search(params = {}) {
    return request({ url: `/api/v1/jobs/search${toQuery(params)}`, needAuth: false });
  },
  aiSearch(params) {
    return request({ url: '/api/v1/jobs/ai-search', method: 'POST', data: params });
  }
};

// ========== 投递 ==========
const applications = {
  apply(data) {
    return request({ url: '/api/v1/applications', method: 'POST', data });
  },
  getMy() {
    return request({ url: '/api/v1/applications/my' });
  },
  getByJob(jobId, params = {}) {
    return request({ url: `/api/v1/applications/job/${jobId}${toQuery(params)}` });
  },
  updateStatus(id, status, remark) {
    return request({ url: `/api/v1/applications/${id}/status`, method: 'PUT', data: { status, remark } });
  },
  setFavorite(id) {
    return request({ url: `/api/v1/applications/${id}/favorite`, method: 'POST' });
  },
  getLogs(id) {
    return request({ url: `/api/v1/applications/${id}/logs` });
  }
};

// ========== 聊天 ==========
const chat = {
  createConversation(targetUserId) {
    return request({ url: '/api/v1/chat/conversations', method: 'POST', data: { target_user_id: targetUserId } });
  },
  getConversations() {
    return request({ url: '/api/v1/chat/conversations' });
  },
  getConversationDetail(conversationId) {
    return request({ url: `/api/v1/chat/conversations/${conversationId}` });
  },
  sendMessage(conversationId, content, messageType) {
    return request({ url: '/api/v1/chat/messages', method: 'POST', data: { conversation_id: conversationId, content, message_type: messageType || 'text' } });
  },
  getMessages(conversationId, params = {}) {
    return request({ url: `/api/v1/chat/messages/${conversationId}${toQuery(params)}` });
  },
  markRead(conversationId) {
    return request({ url: `/api/v1/chat/conversations/${conversationId}/read`, method: 'PUT' });
  },
  getUnreadCount() {
    return request({ url: '/api/v1/chat/unread/count' });
  }
};

// ========== AI 推荐 ==========
const ai = {
  getUserRecommendations() {
    return request({ url: '/api/v1/ai/recommendations/user' });
  },
  getJobCandidates(jobId) {
    return request({ url: `/api/v1/ai/recommendations/job/${jobId}` });
  },
  rebuild() {
    return request({ url: '/api/v1/ai/recommendations/rebuild', method: 'POST' });
  },
  getReason(jobId) {
    return request({ url: `/api/v1/ai/recommendations/reason/${jobId}` });
  }
};

// ========== AI 助手 ==========
const aiAssistant = {
  analyze(input) {
    return request({ url: '/api/v1/ai-assistant/analyze', method: 'POST', data: { input } });
  }
};

// ========== 上传 ==========
const upload = {
  image(filePath, type, extra) {
    return uploadFile(filePath, type, extra);
  },
  jobImage(filePath, jobId) {
    return new Promise((resolve, reject) => {
      const token = getToken();
      wx.uploadFile({
        url: `${BASE_URL}/api/v1/upload/job-image`,
        filePath,
        name: 'file',
        formData: { job_id: String(jobId) },
        header: token ? { Authorization: `Bearer ${token}` } : {},
        success: (res) => {
          try {
            const data = JSON.parse(res.data);
            if (data.code === 0 || data.code === 200) resolve(data.data);
            else reject(new Error(data.message || '上传失败'));
          } catch { reject(new Error('解析响应失败')); }
        },
        fail: () => reject(new Error('上传失败'))
      });
    });
  },
  getJobImages(jobId) {
    return request({ url: `/api/v1/upload/job-images/${jobId}` });
  },
  deleteJobImage(id) {
    return request({ url: `/api/v1/upload/job-image/${id}`, method: 'DELETE' });
  }
};

// ========== 管理后台 ==========
const admin = {
  users: {
    list(params = {}) { return request({ url: `/api/v1/admin/users${toQuery(params)}` }); },
    detail(id) { return request({ url: `/api/v1/admin/users/${id}` }); },
    freeze(id) { return request({ url: `/api/v1/admin/users/${id}/freeze`, method: 'PUT' }); },
    unfreeze(id) { return request({ url: `/api/v1/admin/users/${id}/unfreeze`, method: 'PUT' }); },
    assignRole(userId, roleId) { return request({ url: `/api/v1/admin/users/${userId}/roles`, method: 'POST', data: { role_id: roleId } }); }
  },
  companies: {
    list(params = {}) { return request({ url: `/api/v1/admin/companies${toQuery(params)}` }); },
    detail(id) { return request({ url: `/api/v1/admin/companies/${id}` }); },
    create(data) { return request({ url: '/api/v1/admin/companies', method: 'POST', data }); },
    update(id, data) { return request({ url: `/api/v1/admin/companies/${id}`, method: 'PUT', data }); },
    approve(id) { return request({ url: `/api/v1/admin/companies/${id}/approve`, method: 'PUT' }); },
    reject(id, reason) { return request({ url: `/api/v1/admin/companies/${id}/reject`, method: 'PUT', data: { reason } }); }
  },
  jobs: {
    list(params = {}) { return request({ url: `/api/v1/admin/jobs${toQuery(params)}` }); },
    detail(id) { return request({ url: `/api/v1/admin/jobs/${id}` }); },
    audit(id, audit_status) { return request({ url: `/api/v1/admin/jobs/${id}/audit`, method: 'PUT', data: { audit_status } }); },
    online(id) { return request({ url: `/api/v1/admin/jobs/${id}/online`, method: 'PUT' }); },
    offline(id) { return request({ url: `/api/v1/admin/jobs/${id}/offline`, method: 'PUT' }); },
    update(id, data) { return request({ url: `/api/v1/admin/jobs/${id}`, method: 'PUT', data }); }
  },
  applications: {
    list(params = {}) { return request({ url: `/api/v1/admin/applications${toQuery(params)}` }); },
    detail(id) { return request({ url: `/api/v1/admin/applications/${id}` }); },
    updateStatus(id, status) { return request({ url: `/api/v1/admin/applications/${id}/status`, method: 'PUT', data: { status } }); },
    setFavorite(id, is_favorite) { return request({ url: `/api/v1/admin/applications/${id}/favorite`, method: 'PUT', data: { is_favorite } }); },
    getLogs(id) { return request({ url: `/api/v1/admin/applications/${id}/logs` }); }
  },
  tags: {
    list(params = {}) { return request({ url: `/api/v1/admin/tags${toQuery(params)}` }); },
    listAll() { return request({ url: '/api/v1/admin/tags/all' }); },
    create(data) { return request({ url: '/api/v1/admin/tags', method: 'POST', data }); },
    update(id, data) { return request({ url: `/api/v1/admin/tags/${id}`, method: 'PUT', data }); },
    remove(id) { return request({ url: `/api/v1/admin/tags/${id}`, method: 'DELETE' }); }
  },
  dashboard: {
    overview() { return request({ url: '/api/v1/admin/dashboard/overview' }); },
    trend(days) { return request({ url: `/api/v1/admin/dashboard/trend${toQuery({ days })}` }); }
  },
  logs: {
    list(params = {}) { return request({ url: `/api/v1/admin/logs${toQuery(params)}` }); }
  },
  roles: {
    list() { return request({ url: '/api/v1/admin/roles' }); },
    create(data) { return request({ url: '/api/v1/admin/roles', method: 'POST', data }); },
    update(id, data) { return request({ url: `/api/v1/admin/roles/${id}`, method: 'PUT', data }); },
    remove(id) { return request({ url: `/api/v1/admin/roles/${id}`, method: 'DELETE' }); },
    setPermissions(id, permission_ids) { return request({ url: `/api/v1/admin/roles/${id}/permissions`, method: 'PUT', data: { permission_ids } }); },
    listPermissions() { return request({ url: '/api/v1/admin/roles/permissions/all' }); }
  }
};

const banners = {
  getActive() {
    return cache.cachedFetch('banners_active', function() {
      return request({ url: '/api/v1/banners', needAuth: false });
    }, 30 * 60 * 1000);
  }
};

const enterprises = {
  getById(id) {
    return request({ url: `/api/v1/enterprises/${id}`, needAuth: false });
  },
  getList() {
    return cache.cachedFetch('enterprises_list', function() {
      return request({ url: '/api/v1/enterprises', needAuth: false });
    }, 30 * 60 * 1000);
  },
  create(data) {
    cache.removeCache('enterprises_list');
    return request({ url: '/api/v1/enterprises', method: 'POST', data });
  },
  join(id) {
    return request({ url: `/api/v1/enterprises/${id}/join`, method: 'POST' });
  }
};

const categories = {
  getList() {
    return cache.cachedFetch('categories_list', function() {
      return request({ url: '/api/v1/categories', needAuth: false });
    }, 60 * 60 * 1000);
  }
};

const notifications = {
  getActive() {
    return cache.cachedFetch('notifications_active', function() {
      return request({ url: '/api/v1/notifications', needAuth: false });
    }, 10 * 60 * 1000);
  },
  getMine() {
    return request({ url: '/api/v1/notifications' });
  },
  markRead(id) {
    cache.removeCache('notifications_active');
    return request({ url: `/api/v1/notifications/${id}/read`, method: 'PUT' });
  }
};

const resumes = {
  getMy() {
    return request({ url: '/api/v1/resumes/me' });
  },
  getById(id) {
    return request({ url: `/api/v1/resumes/${id}` });
  },
  create(data) {
    return request({ url: '/api/v1/resumes', method: 'POST', data });
  },
  update(id, data) {
    return request({ url: `/api/v1/resumes/${id}`, method: 'PUT', data });
  },
  remove(id) {
    return request({ url: `/api/v1/resumes/${id}`, method: 'DELETE' });
  }
};

const quickLinks = {
  getActive() {
    return cache.cachedFetch('quicklinks_active', function() {
      return request({ url: '/api/v1/quick-links', needAuth: false });
    }, 30 * 60 * 1000);
  }
};

const universities = {
  search(keyword) {
    return request({ url: `/api/v1/universities?keyword=${encodeURIComponent(keyword)}`, needAuth: false });
  }
};

const favorites = {
  getList() {
    return request({ url: '/api/v1/favorites' });
  },
  toggle(jobId) {
    return request({ url: '/api/v1/favorites', method: 'POST', data: { jobId } });
  },
  check(jobId) {
    return request({ url: `/api/v1/favorites/check/${jobId}` });
  },
  getCount() {
    return request({ url: '/api/v1/favorites/count' });
  }
};

module.exports = {
  BASE_URL,
  getToken,
  setToken,
  setUserInfo,
  clearAuth,
  request,
  uploadFile,
  toQuery,
  saveLogin,
  auth,
  jobs,
  applications,
  chat,
  ai,
  aiAssistant,
  upload,
  admin,
  banners,
  enterprises,
  categories,
  notifications,
  quickLinks,
  resumes,
  favorites,
  universities
};
