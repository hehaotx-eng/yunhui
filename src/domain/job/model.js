var JobModel = {
  matchUser: function(job, userProfile) {
    var score = 0;
    if (!job || !userProfile) return 0;
    if (userProfile.expectedJob && job.title && userProfile.expectedJob.indexOf(job.title) !== -1) score += 30;
    if (userProfile.skills && job.tags) {
      for (var i = 0; i < userProfile.skills.length; i++) {
        for (var j = 0; j < job.tags.length; j++) {
          if (userProfile.skills[i] === job.tags[j]) score += 15;
        }
      }
    }
    if (userProfile.expectedCity && job.location && userProfile.expectedCity === job.location) score += 20;
    if (userProfile.education && job.education && userProfile.education === job.education) score += 10;
    return Math.min(score, 100);
  },

  extractTags: function(job) {
    var tags = (job.tags || []).slice();
    if (job.experience && tags.indexOf(job.experience) === -1) tags.push(job.experience);
    if (job.education && tags.indexOf(job.education) === -1) tags.push(job.education);
    if (job.jobType) {
      var typeMap = { fulltime: '全职', parttime: '兼职', intern: '实习' };
      var label = typeMap[job.jobType] || job.jobType;
      if (tags.indexOf(label) === -1) tags.push(label);
    }
    return tags;
  },

  search: function(jobs, query) {
    if (!query) return jobs;
    var kw = query.toLowerCase();
    return (jobs || []).filter(function(j) {
      return (j.title || '').toLowerCase().indexOf(kw) !== -1 ||
             (j.company_name || '').toLowerCase().indexOf(kw) !== -1 ||
             (j.location || '').toLowerCase().indexOf(kw) !== -1;
    });
  },

  filter: function(jobs, filters) {
    if (!filters) return jobs;
    return (jobs || []).filter(function(j) {
      if (filters.city && j.location !== filters.city) return false;
      if (filters.category && j.category_id != filters.category) return false;
      if (filters.salary === 'high' && (j.salary_max || 0) < 30) return false;
      if (filters.salary === 'mid') {
        var max = j.salary_max || 0;
        if (max < 10 || max > 30) return false;
      }
      return true;
    });
  }
};

module.exports = JobModel;
