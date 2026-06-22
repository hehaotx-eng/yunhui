var UserModel = {
  calcCompleteness: function(user) {
    var score = 0;
    if (user.phone) score += 30;
    if (user.nickname) score += 30;
    if (user.avatar) score += 40;
    return score;
  },

  getPermissions: function(user) {
    var perms = ['chat:read', 'chat:write'];
    if (!user.isEnterprise()) {
      perms.push('job:apply', 'resume:crud', 'favorite:crud');
    } else {
      perms.push('job:publish', 'enterprise:manage', 'candidate:search', 'candidate:contact');
    }
    if (user.role === 'admin') perms.push('admin:*');
    return perms;
  },

  canPublishJob: function(user) {
    return user.isEnterprise() || user.role === 'admin';
  },

  validateCredentials: function(phone, password) {
    if (!phone || phone.length < 11) return { valid: false, message: '手机号格式错误' };
    if (!password || password.length < 6) return { valid: false, message: '密码长度不足6位' };
    return { valid: true, message: '' };
  }
};

module.exports = UserModel;
