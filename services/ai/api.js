const { request } = require('../core/request');

module.exports = {
  getUserRecommendations() {
    return request({ url: '/api/v1/ai/recommendations/user' });
  },

  getJobCandidates(jobId) {
    return request({ url: `/api/v1/ai/recommendations/job/${jobId}` });
  },

  rebuild() {
    return request({ url: '/api/v1/ai/recommendations/rebuild', method: 'POST' });
  },

  getReason(jobId) {
    return request({ url: `/api/v1/ai/recommendations/reason/${jobId}` });
  }
};
