const BASE_URL = 'http://127.0.0.1:3000';

function getToken() {
  return wx.getStorageSync('token') || '';
}

function setToken(token) {
  wx.setStorageSync('token', token);
}

function setUserInfo(user) {
  wx.setStorageSync('userInfo', user);
  wx.setStorageSync('user', user);
}

function clearAuth() {
  wx.removeStorageSync('token');
  wx.removeStorageSync('userInfo');
  wx.removeStorageSync('userRole');
  wx.removeStorageSync('user');
}

function normalizeResponse(res) {
  const body = res.data || {};
  if (body.success !== undefined) {
    if (body.success) return body.data;
    throw new Error(body.message || '请求失败');
  }
  return body;
}

function request(options) {
  const { url, method = 'GET', data = {}, header = {}, needAuth = true } = options;
  const finalHeader = Object.assign({ 'Content-Type': 'application/json' }, header);

  if (needAuth) {
    const token = getToken();
    if (token) finalHeader.Authorization = `Bearer ${token}`;
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header: finalHeader,
      success: (res) => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(normalizeResponse(res));
            return;
          }
          if (res.statusCode === 401) {
            clearAuth();
            reject(new Error('登录已失效，请重新登录'));
            return;
          }
          reject(new Error((res.data && res.data.message) || `服务异常 ${res.statusCode}`));
        } catch (error) {
          reject(error);
        }
      },
      fail: () => reject(new Error('网络请求失败'))
    });
  });
}

function toQuery(params = {}) {
  const query = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== '')
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  return query ? `?${query}` : '';
}

function saveLogin(data) {
  if (data && data.token) setToken(data.token);
  if (data && data.user) {
    setUserInfo(data.user);
    if (data.user.userType) wx.setStorageSync('userRole', data.user.userType);
  }
  return data;
}

const auth = {
  login(phone, password) {
    return request({
      url: '/api/auth/login',
      method: 'POST',
      data: { phone, password },
      needAuth: false
    }).then(saveLogin);
  },
  registerUser(data) {
    return request({ url: '/api/auth/register/user', method: 'POST', data, needAuth: false });
  },
  registerEnterprise(data) {
    return request({ url: '/api/auth/register/enterprise', method: 'POST', data, needAuth: false });
  },
  getProfile() {
    return request({ url: '/api/auth/profile' });
  },
  refreshToken() {
    return request({ url: '/api/auth/refresh-token', method: 'POST' }).then(saveLogin);
  },
  logout() {
    return request({ url: '/api/auth/logout', method: 'POST' }).finally(clearAuth);
  },
  switchRole() {
    return request({ url: '/api/auth/switch-role', method: 'POST' }).then(saveLogin);
  }
};

const users = {
  getAll(params = {}) {
    return request({ url: `/api/users${toQuery(params)}` });
  },
  getById(id) {
    return request({ url: `/api/users/${id}` });
  },
  create(data) {
    return request({ url: '/api/users', method: 'POST', data });
  },
  update(id, data) {
    return request({ url: `/api/users/${id}`, method: 'PUT', data });
  },
  delete(id) {
    return request({ url: `/api/users/${id}`, method: 'DELETE' });
  }
};

const search = {
  getHot() {
    return request({ url: '/api/search/hot', needAuth: false });
  },
  getHistory() {
    return request({ url: '/api/search/history' });
  },
  clearHistory() {
    return request({ url: '/api/search/history', method: 'DELETE' });
  }
};

const enterprises = {
  getAll(params = {}) {
    return request({ url: `/api/enterprises${toQuery(params)}`, needAuth: false });
  },
  getPending() {
    return request({ url: '/api/enterprises/pending' });
  },
  getById(id) {
    return request({ url: `/api/enterprises/${id}`, needAuth: false });
  },
  getUsers(id) {
    return request({ url: `/api/enterprises/${id}/users` });
  },
  verify(id, data = {}) {
    return request({ url: `/api/enterprises/${id}/verify`, method: 'PUT', data });
  },
  create(data) {
    return request({ url: '/api/enterprises', method: 'POST', data });
  },
  update(id, data) {
    return request({ url: `/api/enterprises/${id}`, method: 'PUT', data });
  },
  delete(id) {
    return request({ url: `/api/enterprises/${id}`, method: 'DELETE' });
  },
  getHot() {
    return request({ url: '/api/enterprises/hot', needAuth: false });
  },
  getNew() {
    return request({ url: '/api/enterprises/new', needAuth: false });
  },
  uploadLogo(id, filePath) {
    return new Promise((resolve, reject) => {
      const token = getToken();
      const header = token ? { Authorization: `Bearer ${token}` } : {};
      
      wx.uploadFile({
        url: `${BASE_URL}/api/enterprises/${id}/logo`,
        filePath: filePath,
        name: 'logo',
        header: header,
        success: (res) => {
          try {
            const data = JSON.parse(res.data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              if (data.success !== undefined) {
                if (data.success) {
                  resolve(data.data);
                } else {
                  reject(new Error(data.message || '上传失败'));
                }
              } else {
                resolve(data);
              }
            } else {
              reject(new Error((data && data.message) || `上传失败 ${res.statusCode}`));
            }
          } catch (error) {
            reject(new Error('解析响应失败'));
          }
        },
        fail: () => reject(new Error('网络请求失败'))
      });
    });
  }
};

const jobs = {
  getAll(params = {}) {
    return request({ url: `/api/jobs${toQuery(params)}`, needAuth: false });
  },
  getById(id) {
    return request({ url: `/api/jobs/${id}`, needAuth: false });
  },
  getNearby(params = {}) {
    return request({ url: `/api/jobs/nearby${toQuery(params)}`, needAuth: false });
  },
  getEnterpriseJobs(enterpriseId) {
    return request({ url: `/api/jobs/enterprise/${enterpriseId}`, needAuth: true });
  },
  create(data) {
    return request({ url: '/api/jobs/enterprise/create', method: 'POST', data, needAuth: true });
  },
  update(id, data) {
    return request({ url: `/api/jobs/enterprise/${id}`, method: 'PUT', data, needAuth: true });
  },
  delete(id) {
    return request({ url: `/api/jobs/enterprise/${id}`, method: 'DELETE', needAuth: true });
  },
  publish(id) {
    return request({ url: `/api/jobs/${id}/publish`, method: 'POST', needAuth: true });
  },
  offline(id) {
    return request({ url: `/api/jobs/${id}/offline`, method: 'POST', needAuth: true });
  },
  refresh(id) {
    return request({ url: `/api/jobs/${id}/refresh`, method: 'POST', needAuth: true });
  },
  copy(id) {
    return request({ url: `/api/jobs/${id}/copy`, method: 'POST', needAuth: true });
  }
};

const banners = {
  getAll() {
    return request({ url: '/api/banners', needAuth: false });
  }
};

const categories = {
  getAll() {
    return request({ url: '/api/categories', needAuth: false });
  }
};

const resumes = {
  submit(jobId, resumeData = {}) {
    return request({ url: '/api/resumes/submit', method: 'POST', data: { jobId, resumeData } });
  },
  getMyResumes(params = {}) {
    return request({ url: `/api/resumes/my${toQuery(params)}` });
  },
  getByJob(jobId, params = {}) {
    return request({ url: `/api/resumes/job/${jobId}${toQuery(params)}` });
  },
  getById(id) {
    return request({ url: `/api/resumes/${id}` });
  },
  update(id, data) {
    return request({ url: `/api/resumes/${id}`, method: 'PUT', data });
  },
  updateStatus(id, status) {
    return request({ url: `/api/resumes/${id}/status`, method: 'PUT', data: { status } });
  },
  updatePrivacy(id, privacy) {
    return request({ url: `/api/resumes/${id}/privacy`, method: 'PUT', data: { privacy } });
  },
  delete(id) {
    return request({ url: `/api/resumes/${id}`, method: 'DELETE' });
  }
};

const history = {
  getJobs(params = {}) {
    return request({ url: `/api/history/jobs${toQuery(params)}` });
  },
  addJob(jobId) {
    return request({ url: '/api/history/jobs', method: 'POST', data: { jobId } });
  },
  clearJobs() {
    return request({ url: '/api/history/jobs', method: 'DELETE' });
  },
  getResumes(params = {}) {
    return request({ url: `/api/history/resumes${toQuery(params)}` });
  }
};

const favorites = {
  toggle(jobId) {
    return request({ url: '/api/favorites/toggle', method: 'POST', data: { jobId } });
  },
  getList(params = {}) {
    return request({ url: `/api/favorites/my${toQuery(params)}` });
  },
  check(jobId) {
    return request({ url: `/api/favorites/check${toQuery({ jobId })}` });
  },
  create(data) {
    return request({ url: '/api/favorites', method: 'POST', data });
  },
  getById(id) {
    return request({ url: `/api/favorites/${id}` });
  },
  delete(id) {
    return request({ url: `/api/favorites/${id}`, method: 'DELETE' });
  }
};

const messages = {
  send(data) {
    return request({ url: '/api/messages/send', method: 'POST', data });
  },
  getList(params = {}) {
    return request({ url: `/api/messages/list${toQuery(params)}` });
  },
  getConversation(params = {}) {
    return request({ url: `/api/messages/conversation${toQuery(params)}` });
  },
  getConversations(params = {}) {
    return request({ url: `/api/messages/conversations${toQuery(params)}` });
  },
  getById(id) {
    return request({ url: `/api/messages/${id}` });
  },
  update(id, data) {
    return request({ url: `/api/messages/${id}`, method: 'PUT', data });
  },
  delete(id) {
    return request({ url: `/api/messages/${id}`, method: 'DELETE' });
  },
  markAsRead(data) {
    return request({ url: '/api/messages/markasread', method: 'POST', data });
  }
};

const conversations = {
  getList(params = {}) {
    return request({ url: `/api/conversations${toQuery(params)}` });
  },
  create(data) {
    return request({ url: '/api/conversations', method: 'POST', data });
  },
  getById(id) {
    return request({ url: `/api/conversations/${id}` });
  },
  getUnreadCount() {
    return request({ url: '/api/conversations/unread-count' });
  },
  markRead(id) {
    return request({ url: `/api/conversations/${id}/read`, method: 'PUT' });
  }
};

const notifications = {
  getMine(params = {}) {
    return request({ url: `/api/notifications${toQuery(params)}` });
  },
  markRead(id) {
    return request({ url: `/api/notifications/${id}/read`, method: 'PUT' });
  }
};

const reports = {
  create(jobId, reason) {
    return request({ url: '/api/reports', method: 'POST', data: { jobId, reason } });
  }
};

const candidates = {
  getAll(params = {}) {
    return request({ url: `/api/candidates${toQuery(params)}` });
  },
  getById(id) {
    return request({ url: `/api/candidates/${id}` });
  },
  getMyProfile() {
    return request({ url: '/api/candidates/me/profile' });
  },
  update(data) {
    return request({ url: '/api/candidates/me', method: 'PUT', data });
  }
};

const interviews = {
  create(data) {
    return request({ url: '/api/interviews', method: 'POST', data });
  },
  getEnterprise(params = {}) {
    return request({ url: `/api/interviews/enterprise${toQuery(params)}` });
  },
  getMy(params = {}) {
    return request({ url: `/api/interviews/me${toQuery(params)}` });
  },
  update(id, data) {
    return request({ url: `/api/interviews/${id}`, method: 'PUT', data });
  },
  delete(id) {
    return request({ url: `/api/interviews/${id}`, method: 'DELETE' });
  }
};

const auditLogs = {
  getAll(params = {}) {
    return request({ url: `/api/audit-logs${toQuery(params)}` });
  }
};

module.exports = {
  BASE_URL,
  getToken,
  setToken,
  setUserInfo,
  clearAuth,
  request,
  auth,
  users,
  search,
  enterprises,
  banners,
  categories,
  jobs,
  resumes,
  history,
  favorites,
  messages,
  conversations,
  notifications,
  reports,
  candidates,
  interviews,
  auditLogs
};
