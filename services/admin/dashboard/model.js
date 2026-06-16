function createDashboard(data = {}) {
  return {
    total_users: data.total_users || 0,
    total_jobs: data.total_jobs || 0,
    total_companies: data.total_companies || 0,
    total_applications: data.total_applications || 0,
    new_users_today: data.new_users_today || 0,
    new_jobs_today: data.new_jobs_today || 0
  };
}

module.exports = { createDashboard };
