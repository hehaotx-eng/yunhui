var adapter = require('../adapter/index');

var PlatformTenant = {
  getTenantId: function() {
    var user = adapter.storage.get('userInfo');
    return (user && user.company_id) || null;
  },

  isEnterprise: function() {
    return !!this.getTenantId();
  },

  isUser: function() {
    return !this.getTenantId();
  },

  getIsolationFilter: function() {
    var tenantId = this.getTenantId();
    if (tenantId) return { company_id: tenantId };
    return {};
  },

  getScope: function() {
    return this.isEnterprise() ? 'enterprise' : 'user';
  }
};

module.exports = PlatformTenant;
