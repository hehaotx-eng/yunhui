function EnterpriseEntity(data) {
  this.id = data.id || null;
  this.name = data.name || data.company_name || '';
  this.logo = data.logo || data.company_logo || '';
  this.adminId = data.admin_id || null;
  this.industry = data.industry || '';
  this.scale = data.scale || '';
  this.contactPhone = data.contact_phone || data.contactPhone || '';
  this.status = data.status || 'active';
}

EnterpriseEntity.prototype.isValid = function() { return !!this.id; };

function CandidateEntity(data) {
  this.userId = data.user_id || null;
  this.nickname = data.nickname || '';
  this.avatar = data.avatar || '';
  this.resumeId = data.resume_id || null;
  this.title = data.title || '';
  this.expectedJob = data.expectedJob || '';
  this.skills = data.skills || [];
  this.school = data.school || '';
  this.education = data.education || '';
  this.location = data.location || '';
  this.summary = data.summary || '';
}

CandidateEntity.prototype.hasResume = function() { return !!this.resumeId; };

module.exports = { EnterpriseEntity: EnterpriseEntity, CandidateEntity: CandidateEntity };
