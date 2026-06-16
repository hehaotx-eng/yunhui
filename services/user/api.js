const { request, toQuery } = require('../core/request');

module.exports = {
  login(phone, password) {
    return request({ url: '/api/v1/users/login', method: 'POST', data: { phone, password }, needAuth: false });
  },

  register(data) {
    return request({ url: '/api/v1/users/register', method: 'POST', data, needAuth: false });
  },

  getMe() {
    return request({ url: '/api/v1/users/me' });
  },

  getAdminList(params = {}) {
    return request({ url: `/api/v1/admin/users${toQuery(params)}` });
  },

  getAdminDetail(id) {
    return request({ url: `/api/v1/admin/users/${id}` });
  },

  freeze(id) {
    return request({ url: `/api/v1/admin/users/${id}/freeze`, method: 'PUT' });
  },

  unfreeze(id) {
    return request({ url: `/api/v1/admin/users/${id}/unfreeze`, method: 'PUT' });
  },

  assignRole(userId, roleId) {
    return request({ url: `/api/v1/admin/users/${userId}/roles`, method: 'POST', data: { role_id: roleId } });
  }
};
