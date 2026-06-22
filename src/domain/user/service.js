var model = require('./model');
var entity = require('./entity');

var UserService = {
  evaluate: function(userData) {
    var user = entity.createUser(userData);
    return {
      entity: user,
      completeness: model.calcCompleteness(user),
      permissions: model.getPermissions(user),
      canPublish: model.canPublishJob(user),
      canChat: true,
      canApply: !user.isEnterprise()
    };
  },

  validate: function(phone, password) {
    return model.validateCredentials(phone, password);
  }
};

module.exports = UserService;
