const BASE_URL = 'http://127.0.0.1:3000';

function getToken() {
  return wx.getStorageSync('token') || '';
}

function setToken(token) {
  wx.setStorageSync('token', token);
}

function setUserInfo(user) {
  wx.setStorageSync('userInfo', user);
}

function request(options) {
  const { url, method = 'GET', data = {}, header = {}, needAuth = true } = options;

  const defaultHeader = {
    'Content-Type': 'application/json',
    ...header
  };

  if (needAuth) {
    const token = getToken();
    if (token) {
      defaultHeader['Authorization'] = `Bearer ${token}`;
    }
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header: defaultHeader,
      success: (res) => {
        if (res.statusCode === 200) {
          if (res.data.success !== undefined) {
            if (res.data.success) {
              resolve(res.data.data);
            } else {
              reject(new Error(res.data.message || '请求失败'));
            }
          } else {
            resolve(res.data);
          }
        } else if (res.statusCode === 401) {
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          reject(new Error('未认证，请重新登录'));
        } else if (res.statusCode === 403) {
          reject(new Error('权限不足'));
        } else if (res.statusCode === 404) {
          reject(new Error('资源不存在'));
        } else {
          reject(new Error('服务器错误: ' + res.statusCode));
        }
      },
      fail: (err) => {
        console.error('网络请求失败:', err);
        reject(new Error('网络请求失败'));
      }
    });
  });
}

const auth = {
  login: async (phone, password) => {
    const data = await request({
      url: '/api/auth/login',
      method: 'POST',
      data: { phone, password },
      needAuth: false
    });
    if (data.token) {
      setToken(data.token);
      setUserInfo(data.user);
      if (data.user?.userType) {
        wx.setStorageSync('userRole', data.user.userType);
      }
    }
    return data;
  },

  registerUser: async (username, email, password) => {
    return request({
      url: '/api/auth/register/user',
      method: 'POST',
      data: { username, email, password },
      needAuth: false
    });
  },

  registerEnterprise: async (data) => {
    return request({
      url: '/api/auth/register/enterprise',
      method: 'POST',
      data,
      needAuth: false
    });
  },

  getProfile: async () => {
    return request({
      url: '/api/auth/profile',
      method: 'GET'
    });
  },

  logout: async () => {
    try {
      await request({
        url: '/api/auth/logout',
        method: 'POST'
      });
    } finally {
      wx.removeStorageSync('token');
      wx.removeStorageSync('userInfo');
    }
  },

  wechatSession: async (code) => {
    return request({
      url: '/api/auth/wechat-session',
      method: 'POST',
      data: { code },
      needAuth: false
    });
  },

  wechatLogin: async (data) => {
    const result = await request({
      url: '/api/auth/wechat-login',
      method: 'POST',
      data,
      needAuth: false
    });
    if (result.token) {
      setToken(result.token);
      setUserInfo(result.user);
    }
    return result;
  }
};

const banners = {
  getAll: async () => {
    return request({
      url: '/api/banners',
      method: 'GET',
      needAuth: false
    });
  },

  create: async (data) => {
    return request({
      url: '/api/banners',
      method: 'POST',
      data
    });
  },

  update: async (id, data) => {
    return request({
      url: `/api/banners/${id}`,
      method: 'PUT',
      data
    });
  },

  delete: async (id) => {
    return request({
      url: `/api/banners/${id}`,
      method: 'DELETE'
    });
  }
};

const posts = {
  getAll: async (params = {}) => {
    return request({
      url: '/api/posts',
      method: 'GET',
      data: params,
      needAuth: false
    });
  },

  getById: async (id) => {
    return request({
      url: `/api/posts/${id}`,
      method: 'GET',
      needAuth: false
    });
  },

  create: async (data) => {
    return request({
      url: '/api/posts',
      method: 'POST',
      data
    });
  },

  update: async (id, data) => {
    return request({
      url: `/api/posts/${id}`,
      method: 'PUT',
      data
    });
  },

  delete: async (id) => {
    return request({
      url: `/api/posts/${id}`,
      method: 'DELETE'
    });
  }
};

const users = {
  getAll: async () => {
    return request({
      url: '/api/users',
      method: 'GET'
    });
  },

  getById: async (id) => {
    return request({
      url: `/api/users/${id}`,
      method: 'GET'
    });
  },

  create: async (data) => {
    return request({
      url: '/api/users',
      method: 'POST',
      data
    });
  },

  update: async (id, data) => {
    return request({
      url: `/api/users/${id}`,
      method: 'PUT',
      data
    });
  },

  delete: async (id) => {
    return request({
      url: `/api/users/${id}`,
      method: 'DELETE'
    });
  }
};

const jobs = {
  getAll: async (params = {}) => {
    return request({
      url: '/api/jobs',
      method: 'GET',
      data: params,
      needAuth: false
    });
  },

  getById: async (id) => {
    return request({
      url: `/api/jobs/${id}`,
      method: 'GET',
      needAuth: false
    });
  },

  create: async (data) => {
    return request({
      url: '/api/jobs',
      method: 'POST',
      data
    });
  },

  update: async (id, data) => {
    return request({
      url: `/api/jobs/${id}`,
      method: 'PUT',
      data
    });
  },

  delete: async (id) => {
    return request({
      url: `/api/jobs/${id}`,
      method: 'DELETE'
    });
  }
};

const enterprises = {
  getAll: async () => {
    return request({
      url: '/api/enterprises',
      method: 'GET'
    });
  },

  getPending: async () => {
    return request({
      url: '/api/enterprises/pending',
      method: 'GET'
    });
  },

  getById: async (id) => {
    return request({
      url: `/api/enterprises/${id}`,
      method: 'GET'
    });
  },

  verify: async (id) => {
    return request({
      url: `/api/enterprises/${id}/verify`,
      method: 'PUT'
    });
  },

  create: async (data) => {
    return request({
      url: '/api/enterprises',
      method: 'POST',
      data
    });
  },

  delete: async (id) => {
    return request({
      url: `/api/enterprises/${id}`,
      method: 'DELETE'
    });
  }
};

const conversations = {
  getList: async () => {
    return request({ url: '/api/conversations', method: 'GET' });
  },

  create: async (data) => {
    return request({ url: '/api/conversations', method: 'POST', data });
  },

  getById: async (id) => {
    return request({ url: `/api/conversations/${id}`, method: 'GET' });
  },

  markRead: async (id) => {
    return request({ url: `/api/conversations/${id}/read`, method: 'PUT' });
  }
};

const messages = {
  getByConversation: async (conversationId, page = 1, pageSize = 20) => {
    return request({
      url: `/api/messages/${conversationId}`,
      method: 'GET',
      data: { page, pageSize }
    });
  }
};

module.exports = {
  BASE_URL,
  getToken,
  setToken,
  setUserInfo,
  auth,
  banners,
  posts,
  jobs,
  enterprises,
  users,
  conversations,
  messages
};
