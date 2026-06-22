var FeatureExtractor = {
  extract: function(job, user) {
    var profile = (user && user.content) || user || {};
    return {
      userFeatures: {
        skills: profile.skills || [],
        expectedJob: profile.expectedJob || '',
        expectedCity: profile.expectedCity || profile.location || '',
        expectedSalary: profile.expectedSalary || '',
        education: profile.education || '',
        experience: profile.experience || ''
      },
      jobFeatures: {
        title: (job && job.title) || '',
        tags: (job && job.tags) || [],
        location: (job && job.location) || '',
        salary: (job && job.salary) || '',
        education: (job && job.education) || '',
        experience: (job && job.experience) || ''
      },
      contextFeatures: {
        timestamp: Date.now(),
        device: 'weapp'
      }
    };
  }
};

module.exports = FeatureExtractor;
