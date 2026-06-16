const jobApi = require('./api');
const { createJob, createApplication } = require('./model');
const { normalizeFeedResponse, jobToFeedItem } = require('../core/feed-adapter');

function toServerJob(form) {
  return {
    title: form.title,
    location: form.location,
    description: form.description,
    requirements: form.requirements,
    job_type: form.job_type,
    salary_min: form.salary_min ? Number(form.salary_min) : 0,
    salary_max: form.salary_max ? Number(form.salary_max) : 0
  };
}

function extractList(result) {
  return result.list || result.rows || result || [];
}

module.exports = {
  async getJobList(params) {
    const result = await jobApi.getAll(params);
    return extractList(result).map(createJob);
  },

  async searchJobs(params) {
    const result = await jobApi.search(params);
    const list = extractList(result).map(createJob);
    const page = params.page || 1;
    const limit = params.limit || 10;
    return { list, total: result.total || 0, hasMore: result.total ? page * limit < result.total : list.length >= limit };
  },

  async recommendJobs(params) {
    const result = await jobApi.recommend(params);
    const list = extractList(result).map(createJob);
    const page = params.page || 1;
    const limit = params.limit || 10;
    return { list, total: result.total || 0, hasMore: result.total ? page * limit < result.total : list.length >= limit };
  },

  async getJobFeed(params) {
    const result = await jobApi.getAll(params);
    const jobs = extractList(result).map(createJob);
    const page = params.page || 1;
    const limit = params.limit || 10;
    return {
      list: jobs.map(jobToFeedItem),
      hasMore: result.total ? page * limit < result.total : jobs.length >= limit,
      page,
      page_size: limit,
      total: result.total || 0
    };
  },

  async getJobDetail(id) {
    const data = await jobApi.getById(id);
    return createJob(data);
  },

  async getMyJobs() {
    const result = await jobApi.getMyList();
    return extractList(result).map(createJob);
  },

  async publishJob(form) {
    const data = toServerJob(form);
    if (!data.title) throw new Error('请输入职位名称');
    if (!data.location) throw new Error('请输入工作地点');
    if (!data.description) throw new Error('请输入职位描述');
    return jobApi.create(data);
  },

  async updateJob(id, form) {
    const data = toServerJob(form);
    if (!data.title) throw new Error('请输入职位名称');
    if (!data.location) throw new Error('请输入工作地点');
    if (!data.description) throw new Error('请输入职位描述');
    return jobApi.update(id, data);
  },

  async deleteJob(id) {
    return jobApi.remove(id);
  },

  async aiSearch(params) {
    const result = await jobApi.aiSearch(params);
    return extractList(result).map(createJob);
  },

  async getAdminList(params) {
    const result = await jobApi.getAdminList(params);
    return extractList(result).map(createJob);
  },

  async auditJob(id, status) {
    return jobApi.audit(id, status);
  },

  async setOnline(id) {
    return jobApi.online(id);
  },

  async setOffline(id) {
    return jobApi.offline(id);
  },

  async applyToJob(jobId, extra = {}) {
    return jobApi.apply({ job_id: Number(jobId), ...extra });
  },

  async getMyApplications() {
    const result = await jobApi.getMyApplications();
    return extractList(result).map(createApplication);
  },

  async getJobApplications(jobId, params) {
    const result = await jobApi.getApplicationsByJob(jobId, params);
    return extractList(result).map(createApplication);
  },

  async updateApplicationStatus(id, status, remark) {
    return jobApi.updateApplicationStatus(id, status, remark);
  },

  async toggleApplicationFavorite(id) {
    return jobApi.setApplicationFavorite(id);
  },

  async getApplicationLogs(id) {
    return jobApi.getApplicationLogs(id);
  },

  async getAdminApplications(params) {
    const result = await jobApi.getAdminApplications(params);
    return extractList(result).map(createApplication);
  }
};
