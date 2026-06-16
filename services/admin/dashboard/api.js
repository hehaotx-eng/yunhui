const { request, toQuery } = require('../../core/request');

module.exports = {
  getOverview() {
    return request({ url: '/api/v1/admin/dashboard/overview' });
  },

  getTrend(days) {
    return request({ url: `/api/v1/admin/dashboard/trend${toQuery({ days })}` });
  }
};
