/**
 * 带 SWR 缓存的请求工具
 * 对 api.request 的包装，增加双层缓存 + 静默更新
 */

var api = require('./api');
var swrCache = require('./swr-cache');

/**
 * 生成缓存 key
 */
function makeKey(url, data) {
  if (!data || Object.keys(data).length === 0) return url;
  var sorted = Object.keys(data).sort().map(function(k) { return k + '=' + JSON.stringify(data[k]); }).join('&');
  return url + '?' + sorted;
}

/**
 * 带缓存的 GET 请求
 * @param {string} url - 接口路径
 * @param {object} data - 查询参数
 * @param {object} opts - { ttl, force, onUpdate, needAuth }
 * @returns {Promise}
 */
function cachedGet(url, data, opts) {
  opts = opts || {};
  var key = makeKey(url, data);
  var needAuth = opts.needAuth !== false;

  return swrCache.swr(
    key,
    function() { return api.request({ url: url, method: 'GET', data: data || {}, needAuth: needAuth }); },
    { ttl: opts.ttl, force: opts.force, onUpdate: opts.onUpdate }
  );
}

/**
 * POST 请求（不缓存，但清除相关缓存前缀）
 * @param {string} url - 接口路径
 * @param {object} data - 请求体
 * @param {object} opts - { needAuth, bustPrefix }
 * @returns {Promise}
 */
function mutatingPost(url, data, opts) {
  opts = opts || {};
  if (opts.bustPrefix) {
    swrCache.clearPrefix(opts.bustPrefix);
  }
  return api.request({ url: url, method: 'POST', data: data || {}, needAuth: opts.needAuth !== false });
}

/**
 * PUT 请求（不缓存，但清除相关缓存前缀）
 */
function mutatingPut(url, data, opts) {
  opts = opts || {};
  if (opts.bustPrefix) {
    swrCache.clearPrefix(opts.bustPrefix);
  }
  return api.request({ url: url, method: 'PUT', data: data || {}, needAuth: opts.needAuth !== false });
}

/**
 * 清除指定 URL 前缀的缓存
 */
function bust(urlPrefix) {
  swrCache.clearPrefix(urlPrefix);
}

/**
 * 清除所有缓存
 */
function bustAll() {
  swrCache.clearAll();
}

module.exports = {
  cachedGet: cachedGet,
  mutatingPost: mutatingPost,
  mutatingPut: mutatingPut,
  bust: bust,
  bustAll: bustAll,
  makeKey: makeKey,
  cache: swrCache
};
