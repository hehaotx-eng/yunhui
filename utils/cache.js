var CACHE_PREFIX = 'cache_';
var DEFAULT_TTL = 30 * 60 * 1000;

function getCache(key) {
  try {
    var raw = wx.getStorageSync(CACHE_PREFIX + key);
    if (!raw) return null;
    if (Date.now() - raw.ts > (raw.ttl || DEFAULT_TTL)) {
      wx.removeStorageSync(CACHE_PREFIX + key);
      return null;
    }
    return raw.data;
  } catch (e) {
    return null;
  }
}

function setCache(key, data, ttl) {
  try {
    wx.setStorageSync(CACHE_PREFIX + key, {
      data: data,
      ts: Date.now(),
      ttl: ttl || DEFAULT_TTL
    });
  } catch (e) {}
}

function removeCache(key) {
  try {
    wx.removeStorageSync(CACHE_PREFIX + key);
  } catch (e) {}
}

function clearAllCache() {
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

function cachedFetch(key, fetchFn, ttl) {
  var cached = getCache(key);
  if (cached !== null) {
    return Promise.resolve(cached);
  }
  return fetchFn().then(function (data) {
    setCache(key, data, ttl);
    return data;
  });
}

module.exports = {
  getCache: getCache,
  setCache: setCache,
  removeCache: removeCache,
  clearAllCache: clearAllCache,
  cachedFetch: cachedFetch
};
