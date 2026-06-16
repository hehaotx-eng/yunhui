const { createAICard, ConfidenceLevel } = require('../core/contracts');

function createRecommendation(data = {}) {
  return createAICard(data);
}

function createCandidateRecommendation(data = {}) {
  return {
    user_id: data.user_id || '',
    user_name: data.user_name || '',
    score: data.score || 0,
    reason: data.reason || '',
    match_skills: data.match_skills || []
  };
}

module.exports = {
  ConfidenceLevel,
  createRecommendation,
  createCandidateRecommendation
};
