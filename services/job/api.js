const { request, toQuery } = require('../core/request');

module.exports = {
  getAll(params = {}) {
    return request({ url: `/api/v1/jobs${toQuery(params)}`, needAuth: false });
  },

  search(params = {}) {
    return request({ url: `/api/v1/jobs/search${toQuery(params)}`, needAuth: false });
  },

  recommend(params = {}) {
    return request({ url: `/api/v1/jobs/recommend${toQuery(params)}`, needAuth: false });
  },

  getById(id) {
    return request({ url: `/api/v1/jobs/${id}`, needAuth: false });
  },

  getMyList() {
    return request({ url: '/api/v1/jobs/my/list' });
  },

  create(data) {
    return request({ url: '/api/v1/jobs', method: 'POST', data });
  },

  update(id, data) {
    return request({ url: `/api/v1/jobs/${id}`, method: 'PUT', data });
  },

  remove(id) {
    return request({ url: `/api/v1/jobs/${id}`, method: 'DELETE' });
  },

  aiSearch(params) {
    return request({ url: '/api/v1/jobs/ai-search', method: 'POST', data: params });
  },

  getAdminList(params = {}) {
    return request({ url: `/api/v1/admin/jobs${toQuery(params)}` });
  },

  getAdminDetail(id) {
    return request({ url: `/api/v1/admin/jobs/${id}` });
  },

  audit(id, audit_status) {
    return request({ url: `/api/v1/admin/jobs/${id}/audit`, method: 'PUT', data: { audit_status } });
  },

  online(id) {
    return request({ url: `/api/v1/admin/jobs/${id}/online`, method: 'PUT' });
  },

  offline(id) {
    return request({ url: `/api/v1/admin/jobs/${id}/offline`, method: 'PUT' });
  },

  apply(data) {
    return request({ url: '/api/v1/applications', method: 'POST', data });
  },

  getMyApplications() {
    return request({ url: '/api/v1/applications/my' });
  },

  getApplicationsByJob(jobId, params = {}) {
    return request({ url: `/api/v1/applications/job/${jobId}${toQuery(params)}` });
  },

  updateApplicationStatus(id, status, remark) {
    return request({ url: `/api/v1/applications/${id}/status`, method: 'PUT', data: { status, remark } });
  },

  setApplicationFavorite(id) {
    return request({ url: `/api/v1/applications/${id}/favorite`, method: 'POST' });
  },

  getApplicationLogs(id) {
    return request({ url: `/api/v1/applications/${id}/logs` });
  },

  getAdminApplications(params = {}) {
    return request({ url: `/api/v1/admin/applications${toQuery(params)}` });
  },

  getAdminApplicationDetail(id) {
    return request({ url: `/api/v1/admin/applications/${id}` });
  },

  adminUpdateApplicationStatus(id, status) {
    return request({ url: `/api/v1/admin/applications/${id}/status`, method: 'PUT', data: { status } });
  },

  adminSetApplicationFavorite(id, is_favorite) {
    return request({ url: `/api/v1/admin/applications/${id}/favorite`, method: 'PUT', data: { is_favorite } });
  },

  getAdminApplicationLogs(id) {
    return request({ url: `/api/v1/admin/applications/${id}/logs` });
  }
};
