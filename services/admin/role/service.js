const roleApi = require('./api');
const { createRole, createTag } = require('./model');

function extractList(result) {
  return result.list || result.rows || result || [];
}

module.exports = {
  async getRoles() {
    const result = await roleApi.getRoles();
    return extractList(result).map(createRole);
  },

  async createRole(data) {
    return roleApi.createRole(data);
  },

  async getTags(params) {
    const result = await roleApi.getTags(params);
    return extractList(result).map(createTag);
  },

  async getAllTags() {
    const result = await roleApi.getAllTags();
    return extractList(result).map(createTag);
  },

  async createTag(data) {
    return roleApi.createTag(data);
  }
};
