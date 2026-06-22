var model = require('./model');
var entity = require('./entity');

var JobService = {
  evaluate: function(jobData, userData) {
    var job = entity.createJob(jobData);
    return {
      entity: job,
      matchScore: model.matchUser(job, userData),
      isValid: job.isValid(),
      isActive: job.isActive(),
      tags: model.extractTags(job)
    };
  },

  search: function(jobs, query) {
    return model.search(jobs, query);
  },

  filter: function(jobs, filters) {
    return model.filter(jobs, filters);
  }
};

module.exports = JobService;
