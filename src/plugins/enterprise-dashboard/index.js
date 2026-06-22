module.exports = {
  name: 'enterprise-dashboard',
  version: '2.0.0',

  install: function(core) {
    core.services = core.services || {};
    core.services.enterpriseDashboard = {
      getStats: function(jobs, applications) {
        return {
          jobs: (jobs || []).length,
          applications: (applications || []).length,
          online: (jobs || []).filter(function(j) { return j.status === 'active'; }).length,
          candidates: 0
        };
      },

      formatJobForList: function(job) {
        return {
          id: job.id,
          title: job.title || '',
          status: job.status || 'draft',
          created_at: job.created_at || '',
          applicationCount: job.application_count || 0
        };
      }
    };
  }
};
