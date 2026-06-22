var { BASE_URL, API_PREFIX } = require('../../config/base');

module.exports = {
  BASE_URL: BASE_URL,
  API_PREFIX: API_PREFIX,

  STORAGE_KEYS: {
    TOKEN: 'token',
    USER_INFO: 'userInfo',
    CUSTOM_PHRASES: 'customPhrases'
  },

  MSG_TYPE: {
    TEXT: 'text',
    IMAGE: 'image',
    FILE: 'file',
    JOB: 'job'
  },

  HTTP_CODE: {
    SUCCESS: 0,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    TOO_MANY_REQUESTS: 429,
    SERVER_ERROR: 500
  }
};
