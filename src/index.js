/*
 * src/index.js — 新架构入口
 *
 * 本文件提供新架构的统一导出入口。
 * 旧代码无需任何修改即可继续运行。
 * 新代码可通过此入口使用新架构。
 *
 * 使用示例：
 *   var api = require('../../src/index').api;
 *   api.jobs.getAll({ page: 1 }).then(...)
 *
 *   var store = require('../../src/index').store;
 *   store.user.subscribe(function(key, val) { ... })
 *
 *   var services = require('../../src/index').services;
 *   services.chat.startChat(userId).then(...)
 *
 *   var userModule = require('../../src/index').modules.user;
 *   userModule.login(phone, password).then(...)
 *
 *   var adapter = require('../../src/index').adapter;
 *   adapter.globalData.sync();
 */

var entry = {
  api: require('./api/index'),
  request: require('./api/request'),
  services: require('./services/index'),
  store: require('./store/index'),
  modules: {
    user: require('./modules/user/index'),
    chat: require('./modules/chat/index'),
    enterprise: require('./modules/enterprise/index'),
    feed: require('./modules/feed/index'),
    ai: require('./modules/ai/index')
  },
  domain: {
    user: { entity: require('./domain/user/entity'), service: require('./domain/user/service'), model: require('./domain/user/model') },
    job: { entity: require('./domain/job/entity'), service: require('./domain/job/service'), model: require('./domain/job/model') },
    chat: { entity: require('./domain/chat/entity'), service: require('./domain/chat/service'), model: require('./domain/chat/model') },
    feed: { entity: require('./domain/feed/entity'), service: require('./domain/feed/service'), model: require('./domain/feed/model') },
    ai: { entity: require('./domain/ai/entity'), service: require('./domain/ai/service'), model: require('./domain/ai/model') },
    enterprise: { entity: require('./domain/enterprise/entity'), service: require('./domain/enterprise/service') }
  },
  core: require('./core/index'),
  plugins: {
    aiRecommend: require('./plugins/ai-recommend/index'),
    feedAlgorithm: require('./plugins/feed-algorithm/index'),
    chatEnhance: require('./plugins/chat-enhance/index'),
    enterpriseDashboard: require('./plugins/enterprise-dashboard/index')
  },
  ai: {
    pipeline: require('./ai/pipeline'),
    featureExtractor: require('./ai/featureExtractor'),
    scoringEngine: require('./ai/scoringEngine'),
    ranker: require('./ai/ranker')
  },
  feedEngine: require('./feed-engine/index'),
  platform: {
    auth: require('./platform/auth'),
    tenant: require('./platform/tenant'),
    billing: require('./platform/billing'),
    analytics: require('./platform/analytics'),
    notification: require('./platform/notification')
  },
  constants: require('./constants/index'),
  utils: require('./utils/index'),
  hooks: require('./hooks/index'),
  adapter: require('./adapter/index')
};

module.exports = entry;
