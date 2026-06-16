const { request, toQuery } = require('../../core/request');

module.exports = {
  getLogs(params = {}) {
    return request({ url: `/api/v1/admin/logs${toQuery(params)}` });
  }
};
