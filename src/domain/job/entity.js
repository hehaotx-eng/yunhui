function JobEntity(data) {
  this.id = data.id || null;
  this.title = data.title || '';
  this.companyName = data.company_name || data.enterprise_name || '';
  this.companyLogo = data.company_logo || data.enterprise_logo || '';
  this.salary = data.salary || '';
  this.salaryMin = data.salary_min || 0;
  this.salaryMax = data.salary_max || 0;
  this.location = data.location || data.city || '';
  this.experience = data.experience || '';
  this.education = data.education || '';
  this.tags = data.tags || [];
  this.description = data.description || '';
  this.requirements = data.requirements || '';
  this.jobType = data.job_type || data.type || 'fulltime';
  this.enterpriseId = data.enterprise_id || data.userId || null;
  this.companyId = data.company_id || null;
  this.status = data.status || 'active';
  this.auditStatus = data.audit_status || 'approved';
  this.createdAt = data.created_at || '';
  this.updatedAt = data.updated_at || '';
}

JobEntity.prototype.isValid = function() { return !!this.id && !!this.title; };
JobEntity.prototype.isActive = function() { return this.status === 'active' && this.auditStatus === 'approved'; };
JobEntity.prototype.getSalaryText = function() {
  if (this.salary) return this.salary;
  if (this.salaryMin && this.salaryMax) return this.salaryMin + '-' + this.salaryMax + '元/月';
  if (this.salaryMin) return this.salaryMin + '元/月起';
  return '面议';
};

function createJob(data) { return new JobEntity(data || {}); }

module.exports = { JobEntity: JobEntity, createJob: createJob };
