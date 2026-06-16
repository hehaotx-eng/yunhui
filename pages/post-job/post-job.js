const { jobs } = require('../../utils/api.js');

Page({
  data: {
    isEdit: false,
    jobId: null,
    formData: {
      title: '',
      salary_min: '',
      salary_max: '',
      location: '',
      description: '',
      requirements: '',
      job_type: 'normal'
    },
    jobTypeOptions: [
      { value: 'normal', label: '普通职位' },
      { value: 'premium', label: 'VIP职位' }
    ],
    submitting: false
  },

  onLoad(options) {
    if (options && options.id) {
      this.setData({ isEdit: true, jobId: options.id });
      this.loadJobData(options.id);
    }
  },

  async loadJobData(id) {
    try {
      wx.showLoading({ title: '加载中' });
      const job = await jobs.getById(id);
      this.setData({
        formData: {
          title: job.title || '',
          salary_min: job.salary_min ? String(job.salary_min) : '',
          salary_max: job.salary_max ? String(job.salary_max) : '',
          location: job.location || '',
          description: job.description || '',
          requirements: job.requirements || '',
          job_type: job.job_type || 'normal'
        }
      });
      wx.hideLoading();
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`formData.${field}`]: e.detail.value });
  },

  onTypeChange(e) {
    const index = e.detail.value;
    this.setData({ 'formData.job_type': this.data.jobTypeOptions[index].value });
  },

  async submit() {
    const { formData, isEdit, jobId } = this.data;

    if (!formData.title) {
      wx.showToast({ title: '请输入职位名称', icon: 'none' });
      return;
    }
    if (!formData.location) {
      wx.showToast({ title: '请输入工作地点', icon: 'none' });
      return;
    }
    if (!formData.description) {
      wx.showToast({ title: '请输入职位描述', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    wx.showLoading({ title: isEdit ? '更新中...' : '发布中...' });

    try {
      const data = {
        title: formData.title,
        location: formData.location,
        description: formData.description,
        requirements: formData.requirements,
        job_type: formData.job_type,
        salary_min: formData.salary_min ? Number(formData.salary_min) : 0,
        salary_max: formData.salary_max ? Number(formData.salary_max) : 0
      };

      if (isEdit) {
        await jobs.update(jobId, data);
      } else {
        await jobs.create(data);
      }

      wx.hideLoading();
      wx.showToast({ title: isEdit ? '更新成功' : '发布成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1500);
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: e.message || '操作失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  }
});
