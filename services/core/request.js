const BASE_URL = 'http://localhost:3000';

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

function request(options) {
  const { url, method = 'GET', data = {}, header = {}, needAuth = true } = options;

  let config = {
    url: `${BASE_URL}${url}`,
    method,
    data,
    header: { 'Content-Type': 'application/json', ...header },
    needAuth
  };

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
          const result = runInterceptorChain(interceptors.response, {
            statusCode: res.statusCode,
            data: res.data,
            config
          });
          resolve(result);
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
