const { BASE_URL } = require('../../config/base');

const interceptors = {
  request: [],
  response: []
};

function addRequestInterceptor(fulfilled, rejected) {
  interceptors.request.push({ fulfilled, rejected });
}

function addResponseInterceptor(fulfilled, rejected) {
  interceptors.response.push({ fulfilled, rejected });
}

function runInterceptorChain(chain, input) {
  let result = input;
  for (const interceptor of chain) {
    result = interceptor.fulfilled(result);
  }
  return result;
}

function getToken() {
  try { return wx.getStorageSync('token') || ''; } catch (e) { return ''; }
}

function request(options) {
  const { url, method = 'GET', data = {}, header = {}, needAuth = true } = options;

  let config = {
    url: `${BASE_URL}${url}`,
    method,
    data,
    header: { 'Content-Type': 'application/json', ...header },
    needAuth
  };

  if (needAuth) {
    const token = getToken();
    if (token) {
      config.header.Authorization = `Bearer ${token}`;
    }
  }

  try {
    config = runInterceptorChain(interceptors.request, config);
  } catch (err) {
    return Promise.reject(err);
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: config.url,
      method: config.method,
      data: config.data,
      header: config.header,
      timeout: 30000,
      success(res) {
        try {
          if (interceptors.response.length > 0) {
            const result = runInterceptorChain(interceptors.response, {
              statusCode: res.statusCode,
              data: res.data,
              config
            });
            resolve(result);
          } else {
            const body = res.data || {};
            if (res.statusCode >= 200 && res.statusCode < 300) {
              if (body.code === 0 || body.code === 200) {
                resolve(body.data);
              } else {
                reject(new Error(body.message || '请求失败'));
              }
            } else if (res.statusCode === 401) {
              reject(new Error(config.needAuth ? '登录已失效，请重新登录' : '需要登录'));
            } else if (res.statusCode === 403) {
              reject(new Error('权限不足'));
            } else {
              reject(new Error(body.message || '服务异常'));
            }
          }
        } catch (err) {
          reject(err);
        }
      },
      fail() {
        reject(new Error('网络请求失败'));
      }
    });
  });
}

function upload(filePath, options = {}) {
  const { url, name = 'file', formData = {}, header = {} } = options;
  const token = wx.getStorageSync('token') || '';
  const finalHeader = token ? { Authorization: `Bearer ${token}`, ...header } : header;

  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: `${BASE_URL}${url}`,
      filePath,
      name,
      formData,
      header: finalHeader,
      success(res) {
        try {
          const parsed = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
          if (parsed.code === 0 || parsed.code === 200) {
            resolve(parsed.data);
          } else {
            reject(new Error(parsed.message || '上传失败'));
          }
        } catch {
          reject(new Error('解析响应失败'));
        }
      },
      fail() {
        reject(new Error('上传失败'));
      }
    });
  });
}

function toQuery(params = {}) {
  const query = Object.keys(params)
    .filter(k => params[k] !== undefined && params[k] !== null && params[k] !== '')
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join('&');
  return query ? `?${query}` : '';
}

module.exports = {
  BASE_URL,
  request,
  upload,
  toQuery,
  addRequestInterceptor,
  addResponseInterceptor
};
