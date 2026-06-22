var AIModel = {
  calculateScore: function(jobData, userData) {
    var score = 0;
    if (!jobData || !userData) return { baseScore: 0, aiScore: 0, finalScore: 0 };
    var profile = userData.content || userData;
    if (profile.expectedJob && jobData.title && profile.expectedJob.indexOf(jobData.title) !== -1) score += 25;
    if (profile.skills && jobData.tags) {
      var matchCount = 0;
      for (var i = 0; i < profile.skills.length; i++) {
        for (var j = 0; j < jobData.tags.length; j++) {
          if (profile.skills[i] === jobData.tags[j]) matchCount++;
        }
      }
      score += matchCount * 10;
    }
    if (profile.expectedCity && jobData.location && profile.expectedCity === jobData.location) score += 15;
    if (profile.expectedSalary && jobData.salary) score += 10;
    if (profile.education && jobData.education) {
      var eduOrder = { '博士': 4, '硕士': 3, '本科': 2, '大专': 1 };
      var userEdu = eduOrder[profile.education] || 0;
      var jobEdu = eduOrder[jobData.education] || 0;
      if (userEdu >= jobEdu) score += 10;
    }
    return {
      baseScore: Math.min(score, 60),
      aiScore: Math.min(score * 0.4, 40),
      finalScore: Math.min(score, 100)
    };
  },

  generateReason: function(job, user) {
    var reasons = [];
    var profile = user && (user.content || user);
    if (profile && profile.expectedJob && job && job.title) {
      if (profile.expectedJob.indexOf(job.title) !== -1) reasons.push('职位匹配');
    }
    if (profile && profile.expectedCity && job && job.location) {
      if (profile.expectedCity === job.location) reasons.push('城市匹配');
    }
    return reasons.length > 0 ? '基于' + reasons.join('、') : '智能推荐';
  }
};

module.exports = AIModel;
