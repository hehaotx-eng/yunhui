const { request, upload, toQuery } = require('../core/request');

module.exports = {
  getAdminList(params = {}) {
    return request({ url: `/api/v1/admin/companies${toQuery(params)}` });
  },

  getAdminDetail(id) {
    return request({ url: `/api/v1/admin/companies/${id}` });
  },

  getPublicDetail(id) {
    return request({ url: `/api/v1/enterprises/${id}`, needAuth: false });
  },

  create(data) {
    return request({ url: '/api/v1/admin/companies', method: 'POST', data });
  },

  update(id, data) {
    return request({ url: `/api/v1/admin/companies/${id}`, method: 'PUT', data });
  },

  approve(id) {
    return request({ url: `/api/v1/admin/companies/${id}/approve`, method: 'PUT' });
  },

  reject(id, reason) {
    return request({ url: `/api/v1/admin/companies/${id}/reject`, method: 'PUT', data: { reason } });
  },

  uploadImage(filePath, type, extra = {}) {
    return upload(filePath, { url: '/api/v1/upload/image', formData: { type, ...extra } });
  },

  uploadJobImage(filePath, jobId) {
    return upload(filePath, { url: '/api/v1/upload/job-image', formData: { job_id: String(jobId) } });
  },

  getJobImages(jobId) {
    return request({ url: `/api/v1/upload/job-images/${jobId}` });
  },

  deleteJobImage(id) {
    return request({ url: `/api/v1/upload/job-image/${id}`, method: 'DELETE' });
  }
};
