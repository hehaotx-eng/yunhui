var model = require('./model');

var AIService = {
  score: function(jobData, userData) {
    return model.calculateScore(jobData, userData);
  },

  getRecommendReason: function(job, user) {
    return model.generateReason(job, user);
  }
};

module.exports = AIService;
