var BASE_URL = '';

try {
  var env = require('./env');
  if (env && env.BASE_URL) {
    BASE_URL = env.BASE_URL;
  }
} catch (e) {}

if (!BASE_URL) {
  var envVersion = 'develop';
  try {
    envVersion = __wxConfig.envVersion || 'develop';
  } catch (e) {}

  if (envVersion === 'develop') {
    BASE_URL = 'https://stats-rose-handling-destiny.trycloudflare.com';
  } else {
    throw new Error('BASE_URL 未配置，trial/release 环境必须配置 BASE_URL');
  }
}

module.exports = {
  BASE_URL: BASE_URL,
  API_PREFIX: '/api/v1'
};
