/*
 * modules/ai/index.js — AI模块
 *
 * 依赖规则：
 *   ✔ services / domain
 *   ❌ 不得调用其他 modules
 *   ❌ 不得直接调用 wx API
 */

var request = require('../../api/request');

function toQuery(params) {
  if (!params) return '';
  var keys = Object.keys(params);
  if (keys.length === 0) return '';
  var qs = '?';
  for (var i = 0; i < keys.length; i++) {
    if (i > 0) qs += '&';
    qs += encodeURIComponent(keys[i]) + '=' + encodeURIComponent(params[keys[i]]);
  }
  return qs;
}

var aiModule = {
  getUserRecommendations: function () {
    return request.get('/ai/recommendations/user');
  },

  getJobCandidates: function (jobId) {
    return request.get('/ai/recommendations/job/' + jobId);
  },

  search: function (params) {
    return request.get('/ai/search' + toQuery(params || {}));
  },

  getReason: function (jobId, resumeId) {
    return request.get('/ai/reason?jobId=' + jobId + '&resumeId=' + resumeId);
  }
};

module.exports = aiModule;
