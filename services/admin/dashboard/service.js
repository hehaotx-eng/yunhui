const dashboardApi = require('./api');
const { createDashboard } = require('./model');

module.exports = {
  async getOverview() {
    const data = await dashboardApi.getOverview();
    return createDashboard(data);
  },

  async getTrend(days) {
    return dashboardApi.getTrend(days);
  }
};
