var store = require('../store/index');

var hooks = {};

hooks.useUser = function() {
  return {
    user: store.user.get(),
    isLoggedIn: !!store.user.get('id'),
    isEnterprise: !!store.user.get('company_id'),
    login: function(phone, password) {
      return require('../services/index').auth.login(phone, password);
    },
    logout: function() {
      require('../modules/user/index').logout();
    }
  };
};

hooks.useChat = function() {
  return {
    conversations: store.chat.get('conversations'),
    unreadCount: store.app.get('unreadCount'),
    sendMessage: function(convId, content) {
      return require('../services/index').chat.sendMessage(convId, content);
    }
  };
};

hooks.useApp = function() {
  return {
    isEnterprise: store.app.get('isEnterprise'),
    statusBarHeight: store.app.get('statusBarHeight'),
    unreadCount: store.app.get('unreadCount')
  };
};

module.exports = hooks;
