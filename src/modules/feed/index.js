/*
 * modules/feed/index.js — 信息流模块
 *
 * 依赖规则：
 *   ✔ services / store
 *   ❌ 不得调用其他 modules
 *   ❌ 不得直接调用 wx API
 */

var services = require('../../services/index');
var store = require('../../store/index');

var feedModule = {
  loadJobs: function (params) {
    return services.job.getAll(params).then(function (data) {
      var list = data.list || data.rows || data || [];
      store.feed.set('jobs', list);
      store.feed.set('loading', false);
      return data;
    });
  },

  searchJobs: function (params) {
    return services.job.search(params).then(function (data) {
      var list = data.list || data.rows || data || [];
      store.feed.set('jobs', list);
      return data;
    });
  },

  getJobDetail: function (id) {
    return services.job.getById(id);
  },

  applyToJob: function (jobId) {
    return services.job.apply(jobId);
  }
};

module.exports = feedModule;
