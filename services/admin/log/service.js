const logApi = require('./api');

module.exports = {
  async getLogs(params) {
    return logApi.getLogs(params);
  }
};
