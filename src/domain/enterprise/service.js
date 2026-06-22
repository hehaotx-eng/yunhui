var entity = require('./entity');

var EnterpriseService = {
  createCandidate: function(data) {
    return new entity.CandidateEntity(data || {});
  },

  formatCandidateList: function(list) {
    return (list || []).map(function(d) { return new entity.CandidateEntity(d); });
  },

  formatFavorites: function(list) {
    return (list || []).map(function(fav) {
      return {
        id: fav.id,
        resumeId: fav.resume_id,
        nickname: fav.nickname || '',
        avatar: fav.avatar || '',
        expectedJob: fav.expectedJob || '',
        skills: fav.skills || [],
        school: fav.school || '',
        education: fav.education || '',
        location: fav.location || '',
        summary: fav.summary || ''
      };
    });
  }
};

module.exports = EnterpriseService;
