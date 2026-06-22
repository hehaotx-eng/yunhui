function UserEntity(data) {
  this.id = data.id || null;
  this.phone = data.phone || '';
  this.nickname = data.nickname || '';
  this.avatar = data.avatar || '';
  this.role = data.role || 'user';
  this.companyId = data.company_id || null;
  this.status = data.status || 'active';
  this.isEnterprise = function() { return this.role === 'enterprise' || !!this.companyId; };
  this.isLoggedIn = function() { return !!this.id; };
  this.isValid = function() { return !!this.id && !!this.phone; };
}

function createUser(data) { return new UserEntity(data || {}); }

module.exports = { UserEntity: UserEntity, createUser: createUser };
