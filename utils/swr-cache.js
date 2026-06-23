/**
 * 双层缓存系统：内存缓存 + Storage 缓存
 * 支持：TTL过期、静默更新(stale-while-revalidate)、强制刷新
 */

var CACHE_PREFIX = 'sw_';
var DEFAULT_TTL = 5 * 60 * 1000; // 5分钟

// ========== 内存缓存层 ==========
var _fallbackMem = {};
function _mem() {
  try {
    var app = getApp();
    if (app && app.globalData) {
      if (!app.globalData._memCache) app.globalData._memCache = {};
      return app.globalData._memCache;
    }
  } catch (e) {}
  return _fallbackMem;
}

function memGet(key) {
  var entry = _mem()[key];
  if (!entry) return null;
  return entry;
}

function memSet(key, data, ts, ttl) {
  _mem()[key] = { data: data, ts: ts, ttl: ttl };
}

function memRemove(key) {
  delete _mem()[key];
}

// ========== Storage 缓存层 ==========
function storageGet(key) {
  try {
    var raw = wx.getStorageSync(CACHE_PREFIX + key);
    return raw || null;
  } catch (e) {
    return null;
  }
}

function storageSet(key, data, ts, ttl) {
  try {
    wx.setStorageSync(CACHE_PREFIX + key, { data: data, ts: ts, ttl: ttl });
  } catch (e) {}
}

function storageRemove(key) {
  try {
    wx.removeStorageSync(CACHE_PREFIX + key);
  } catch (e) {}
}

// ========== 核心 API ==========

/**
 * 读取缓存（内存优先，Storage兜底）
 * @returns {{ data, ts, ttl } | null}
 */
function get(key) {
  var mem = memGet(key);
  if (mem) return mem;
  var stor = storageGet(key);
  if (stor) {
    memSet(key, stor.data, stor.ts, stor.ttl); // 回填内存
    return stor;
  }
  return null;
}

/**
 * 写入缓存（双层同步）
 */
function set(key, data, ttl) {
  var ts = Date.now();
  var finalTtl = ttl || DEFAULT_TTL;
  memSet(key, data, ts, finalTtl);
  storageSet(key, data, ts, finalTtl);
}

/**
 * 删除缓存（双层同步）
 */
function remove(key) {
  memRemove(key);
  storageRemove(key);
}

/**
 * 清除所有缓存
 */
function clearAll() {
  var app = getApp();
  if (app.globalData._memCache) app.globalData._memCache = {};
  try {
    var res = wx.getStorageInfoSync();
    var keys = res.keys || [];
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].indexOf(CACHE_PREFIX) === 0) {
        wx.removeStorageSync(keys[i]);
      }
    }
  } catch (e) {}
}

/**
 * 清除匹配前缀的缓存
 */
function clearPrefix(prefix) {
  var fullPrefix = CACHE_PREFIX + prefix;
  var app = getApp();
  var mem = app.globalData._memCache || {};
  Object.keys(mem).forEach(function(k) {
    if (k.indexOf(prefix) === 0) delete mem[k];
  });
  try {
    var res = wx.getStorageInfoSync();
    var keys = res.keys || [];
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].indexOf(fullPrefix) === 0) {
        wx.removeStorageSync(keys[i]);
      }
    }
  } catch (e) {}
}

/**
 * 判断缓存是否过期
 */
function isStale(key) {
  var entry = get(key);
  if (!entry) return true;
  return Date.now() - entry.ts > entry.ttl;
}

/**
 * 判断缓存是否存在（不管过期与否）
 */
function has(key) {
  return get(key) !== null;
}

/**
 * 静默更新策略：
 * - 有缓存且未过期 → 直接返回缓存，不请求
 * - 有缓存但已过期 → 立即返回缓存 + 后台静默请求更新
 * - 无缓存 → 等待请求完成后返回
 *
 * @param {string} key - 缓存key
 * @param {function} fetchFn - 请求函数，返回 Promise
 * @param {object} opts - { ttl, force, onUpdate }
 * @returns {Promise}
 */
function swr(key, fetchFn, opts) {
  opts = opts || {};
  var ttl = opts.ttl || DEFAULT_TTL;
  var force = opts.force || false;
  var onUpdate = opts.onUpdate || null;

  // 强制刷新：跳过缓存
  if (force) {
    return fetchFn().then(function(data) {
      set(key, data, ttl);
      return data;
    });
  }

  var entry = get(key);

  // 无缓存：等待请求
  if (!entry) {
    return fetchFn().then(function(data) {
      set(key, data, ttl);
      return data;
    });
  }

  var age = Date.now() - entry.ts;

  // 缓存未过期：直接返回
  if (age <= entry.ttl) {
    return Promise.resolve(entry.data);
  }

  // 缓存已过期：返回旧数据 + 后台静默更新
  if (onUpdate) {
    fetchFn().then(function(data) {
      set(key, data, ttl);
      onUpdate(data);
    }).catch(function() {});
  } else {
    fetchFn().then(function(data) {
      set(key, data, ttl);
    }).catch(function() {});
  }

  return Promise.resolve(entry.data);
}

module.exports = {
  get: get,
  set: set,
  remove: remove,
  has: has,
  isStale: isStale,
  clearAll: clearAll,
  clearPrefix: clearPrefix,
  swr: swr,
  DEFAULT_TTL: DEFAULT_TTL
};
