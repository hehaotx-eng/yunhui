var constants = require('../constants/index');

function _getToken() {
  try {
    var token = wx.getStorageSync('token');
    if (token) return token;
  } catch (e) {}
  return '';
}

function _clearAuth() {
  try {
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
  } catch (e) {}
}

var interceptors = {
  request: [],
  response: []
};

function request(options) {
  var { url, method, data, header, needAuth, loading } = options;
  method = method || 'GET';
  data = data || {};
  header = header || {};

  header['Content-Type'] = header['Content-Type'] || 'application/json';

  var chain = { options: { url, method, data, header, needAuth, loading } };

  for (var i = interceptors.request.length - 1; i >= 0; i--) {
    chain = interceptors.request[i](chain);
  }

  var finalOptions = chain.options;

  if (finalOptions.needAuth !== false) {
    var token = _getToken();
    if (token) {
      finalOptions.header.Authorization = 'Bearer ' + token;
    }
  }

  if (finalOptions.loading) {
    wx.showLoading({ title: finalOptions.loading === true ? '加载中...' : finalOptions.loading, mask: true });
  }

  return new Promise(function(resolve, reject) {
    wx.request({
      url: constants.BASE_URL + constants.API_PREFIX + finalOptions.url,
      method: finalOptions.method,
      data: finalOptions.data,
      header: finalOptions.header,
      success: function(res) {
        if (finalOptions.loading) wx.hideLoading();

        if (res.statusCode === 401) {
          _clearAuth();
          reject({ code: -1, message: '登录已失效，请重新登录' });
          return;
        }

        var body = res.data || {};
        var respChain = { statusCode: res.statusCode, body: body, resolve: resolve, reject: reject };
        for (var j = 0; j < interceptors.response.length; j++) {
          respChain = interceptors.response[j](respChain);
        }
        if (respChain.handled) return;
        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (body.code === 0 || body.code === 200) {
            resolve(body.data);
          } else {
            reject({ code: body.code, message: body.message || '请求失败' });
          }
        } else if (res.statusCode === 403) {
          reject({ code: -1, message: '权限不足' });
        } else {
          reject({ code: -1, message: '服务异常(' + res.statusCode + ')' });
        }
      },
      fail: function(err) {
        if (finalOptions.loading) wx.hideLoading();
        reject({ code: -1, message: '网络请求失败' });
      }
    });
  });
}

request.intercept = {
  request: {
    use: function(fn) { interceptors.request.push(fn); return interceptors.request.length - 1; }
  },
  response: {
    use: function(fn) { interceptors.response.push(fn); return interceptors.response.length - 1; }
  }
};

request.get = function(url, params, options) {
  var opts = Object.assign({}, options, { url: url, method: 'GET', data: params });
  return request(opts);
};

request.post = function(url, data, options) {
  var opts = Object.assign({}, options, { url: url, method: 'POST', data: data });
  return request(opts);
};

request.put = function(url, data, options) {
  var opts = Object.assign({}, options, { url: url, method: 'PUT', data: data });
  return request(opts);
};

request.del = function(url, options) {
  var opts = Object.assign({}, options, { url: url, method: 'DELETE' });
  return request(opts);
};

module.exports = request;
