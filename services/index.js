require('./core/interceptor');

const contracts = require('./core/contracts');
const feedEngine = require('./core/feed-engine');
const auth = require('./core/auth');
const job = require('./job/service');
const user = require('./user/service');
const enterprise = require('./enterprise/service');
const ai = require('./ai/service');
const chat = require('./chat/service');
const admin = require('./admin/index');

module.exports = {
  contracts,
  feedEngine,
  auth,
  job,
  user,
  enterprise,
  ai,
  chat,
  admin
};
