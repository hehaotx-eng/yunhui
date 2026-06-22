var FilterEngine = {
  bySalary: function(jobs, range) {
    if (!range) return jobs || [];
    return (jobs || []).filter(function(j) {
      var max = j.salary_max || 0;
      if (range === 'high') return max >= 30 || max === 0;
      if (range === 'mid') return max >= 10 && max < 30;
      if (range === 'low') return max < 10 && max > 0;
      return true;
    });
  },

  byExperience: function(jobs, exp) {
    if (!exp) return jobs || [];
    return (jobs || []).filter(function(j) { return j.experience === exp; });
  },

  byEducation: function(jobs, edu) {
    if (!edu) return jobs || [];
    return (jobs || []).filter(function(j) { return j.education === edu; });
  },

  byTags: function(jobs, tags) {
    if (!tags || tags.length === 0) return jobs || [];
    return (jobs || []).filter(function(j) {
      var jobTags = j.tags || [];
      for (var i = 0; i < tags.length; i++) {
        if (jobTags.indexOf(tags[i]) !== -1) return true;
      }
      return false;
    });
  },

  paginate: function(jobs, page, pageSize) {
    if (!jobs) return { list: [], total: 0 };
    var total = jobs.length;
    var start = ((page || 1) - 1) * (pageSize || 20);
    var end = start + (pageSize || 20);
    return { list: jobs.slice(start, end), total: total };
  }
};

module.exports = FilterEngine;
