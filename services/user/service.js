const userApi = require('./api');
const { createUser } = require('./model');
const { setUserInfo } = require('../core/auth');

module.exports = {
  async register(form) {
    if (!form.phone) throw new Error('请输入手机号');
    if (!form.password) throw new Error('请输入密码');
    return userApi.register(form);
  },

  async getProfile() {
    const data = await userApi.getMe();
    const user = createUser(data);
    setUserInfo(user);
    return user;
  },

  async getAdminList(params) {
    const result = await userApi.getAdminList(params);
    const list = result.list || result.rows || result || [];
    return list.map(createUser);
  },

  async freezeUser(id) {
    return userApi.freeze(id);
  },

  async unfreezeUser(id) {
    return userApi.unfreeze(id);
  }
};
