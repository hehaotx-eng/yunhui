const { request, toQuery } = require('../../core/request');

module.exports = {
  getRoles() {
    return request({ url: '/api/v1/admin/roles' });
  },

  createRole(data) {
    return request({ url: '/api/v1/admin/roles', method: 'POST', data });
  },

  updateRole(id, data) {
    return request({ url: `/api/v1/admin/roles/${id}`, method: 'PUT', data });
  },

  removeRole(id) {
    return request({ url: `/api/v1/admin/roles/${id}`, method: 'DELETE' });
  },

  setRolePermissions(id, permission_ids) {
    return request({ url: `/api/v1/admin/roles/${id}/permissions`, method: 'PUT', data: { permission_ids } });
  },

  getAllPermissions() {
    return request({ url: '/api/v1/admin/roles/permissions/all' });
  },

  getTags(params = {}) {
    return request({ url: `/api/v1/admin/tags${toQuery(params)}` });
  },

  getAllTags() {
    return request({ url: '/api/v1/admin/tags/all' });
  },

  createTag(data) {
    return request({ url: '/api/v1/admin/tags', method: 'POST', data });
  },

  updateTag(id, data) {
    return request({ url: `/api/v1/admin/tags/${id}`, method: 'PUT', data });
  },

  removeTag(id) {
    return request({ url: `/api/v1/admin/tags/${id}`, method: 'DELETE' });
  }
};
