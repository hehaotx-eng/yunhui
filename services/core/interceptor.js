const { addRequestInterceptor, addResponseInterceptor } = require('./request');
const { getToken, handleAuthExpired } = require('./auth');

addRequestInterceptor(
  function tokenInterceptor(config) {
    if (config.needAuth) {
      const token = getToken();
      if (token) {
        config.header.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  function tokenReject(err) {
    return Promise.reject(err);
  }
);

addResponseInterceptor(
  function responseInterceptor(res) {
    const { statusCode, data, config } = res;

    if (statusCode >= 200 && statusCode < 300) {
      const body = data || {};
      if (body.code === 0 || body.code === 200) {
        return body.data;
      }
      throw new Error(body.message || '请求失败');
    }

    if (statusCode === 401) {
      handleAuthExpired();
      throw new Error(config.needAuth ? '登录已失效，请重新登录' : '需要登录');
    }

    if (statusCode === 403) {
      throw new Error('权限不足');
    }

    throw new Error((data && data.message) || `服务异常 ${statusCode}`);
  },
  function responseReject(err) {
    throw err;
  }
);
