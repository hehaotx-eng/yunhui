const {
  JobStatus, AuditStatus, ApplicationStatus,
  createJobCard, createAICard
} = require('../core/contracts');

function createJob(data = {}) {
  return createJobCard(data);
}

function createApplication(data = {}) {
  return {
    id: data.id || '',
    job_id: data.job_id || '',
    job_title: data.job_title || '',
    user_id: data.user_id || '',
    user_name: data.user_name || '',
    enterprise_name: data.enterprise_name || '',
    status: data.status || ApplicationStatus.PENDING,
    resume: data.resume || '',
    cover_letter: data.cover_letter || '',
    remark: data.remark || '',
    is_favorite: data.is_favorite || false,
    created_at: data.created_at || '',
    updated_at: data.updated_at || ''
  };
}

module.exports = {
  JobStatus,
  AuditStatus,
  ApplicationStatus,
  createJob,
  createApplication
};
