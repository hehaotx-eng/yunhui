const enterpriseApi = require('./api');
const { createCompany } = require('./model');

module.exports = {
  async getCompanyList(params) {
    const result = await enterpriseApi.getAdminList(params);
    const list = result.list || result.rows || result || [];
    return list.map(createCompany);
  },

  async getCompanyDetail(id) {
    const data = await enterpriseApi.getPublicDetail(id);
    return data;
  },

  async approveCompany(id) {
    return enterpriseApi.approve(id);
  },

  async rejectCompany(id, reason) {
    return enterpriseApi.reject(id, reason);
  },

  async uploadImage(filePath, type, extra) {
    return enterpriseApi.uploadImage(filePath, type, extra);
  },

  async uploadJobImage(filePath, jobId) {
    return enterpriseApi.uploadJobImage(filePath, jobId);
  },

  async getJobImages(jobId) {
    return enterpriseApi.getJobImages(jobId);
  },

  async deleteJobImage(id) {
    return enterpriseApi.deleteJobImage(id);
  }
};
