const aiApi = require('./api');
const { createRecommendation, createCandidateRecommendation } = require('./model');
const { aiToFeedItem } = require('../core/feed-adapter');

module.exports = {
  async getUserRecommendations() {
    const result = await aiApi.getUserRecommendations();
    const list = result.list || result.rows || result || [];
    return list.map(createRecommendation);
  },

  async getRecommendationFeed() {
    const result = await aiApi.getUserRecommendations();
    const list = result.list || result.rows || result || [];
    const recommendations = list.map(createRecommendation);
    return {
      list: recommendations.map(aiToFeedItem),
      has_more: false,
      page: 1,
      page_size: list.length
    };
  },

  async getJobCandidates(jobId) {
    const result = await aiApi.getJobCandidates(jobId);
    const list = result.list || result.rows || result || [];
    return list.map(createCandidateRecommendation);
  },

  async rebuildIndex() {
    return aiApi.rebuild();
  },

  async getRecommendReason(jobId) {
    return aiApi.getReason(jobId);
  }
};
