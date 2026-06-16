var api = require('../../utils/api');

Page({
  data: {
    statusBarHeight: 0,
    isEdit: false,
    jobId: null,
    form: {
      title: '',
      salary_min: '',
      salary_max: '',
      location: '',
      description: '',
      requirements: '',
      job_type: 'normal',
      experience: '',
      education: '',
      tags: []
    },
    submitting: false,
    savedId: null
  },

  onLoad: function(options) {
    var sys = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: sys.statusBarHeight || 20 });
    if (options && options.id) {
      this.setData({ isEdit: true, jobId: options.id });
      this.loadJob(options.id);
    }
  },

  loadJob: function(id) {
    var that = this;
    wx.showLoading({ title: '加载中' });
    api.jobs.getById(id).then(function(job) {
      that.setData({
        form: {
          title: job.title || '',
          salary_min: job.salary_min ? String(job.salary_min) : '',
          salary_max: job.salary_max ? String(job.salary_max) : '',
          location: job.location || '',
          description: job.description || '',
          requirements: job.requirements || '',
          job_type: job.job_type || 'normal',
          experience: job.experience || '',
          education: job.education || '',
          tags: job.tags || []
        }
      });
      wx.hideLoading();
    }).catch(function(e) {
      wx.hideLoading();
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
    });
  },

  onInput: function(e) {
    var field = e.currentTarget.dataset.field;
    var obj = {};
    obj[field] = e.detail.value;
    this.setData(obj);
  },

  onTypeChange: function(e) {
    var vals = ['normal', 'premium'];
    this.setData({ 'form.job_type': vals[e.detail.value] || 'normal' });
  },

  onExperienceChange: function(e) {
    var vals = ['', '1年以下', '1-3年', '3-5年', '5-10年', '10年以上'];
    this.setData({ 'form.experience': vals[e.detail.value] || '' });
  },

  onEducationChange: function(e) {
    var vals = ['', '高中', '大专', '本科', '硕士', '博士'];
    this.setData({ 'form.education': vals[e.detail.value] || '' });
  },

  toggleTag: function(e) {
    var tag = e.currentTarget.dataset.value;
    var tags = this.data.form.tags;
    var idx = tags.indexOf(tag);
    if (idx === -1) {
      tags.push(tag);
    } else {
      tags.splice(idx, 1);
    }
    this.setData({ 'form.tags': tags });
  },

  submit: function() {
    var that = this;
    var f = that.data.form;
    if (!f.title) { wx.showToast({ title: '请输入职位名称', icon: 'none' }); return; }
    if (!f.location) { wx.showToast({ title: '请输入工作地点', icon: 'none' }); return; }
    if (!f.description) { wx.showToast({ title: '请输入职位描述', icon: 'none' }); return; }

    that.setData({ submitting: true });
    wx.showLoading({ title: that.data.isEdit ? '更新中...' : '发布中...' });

    var data = {
      title: f.title,
      location: f.location,
      description: f.description,
      requirements: f.requirements,
      job_type: f.job_type,
      experience: f.experience,
      education: f.education,
      tags: f.tags,
      salary_min: f.salary_min ? Number(f.salary_min) : 0,
      salary_max: f.salary_max ? Number(f.salary_max) : 0
    };

    var promise;
    if (that.data.isEdit) {
      promise = api.jobs.update(that.data.jobId, data);
    } else {
      promise = api.jobs.create(data);
    }

    promise.then(function(result) {
      wx.hideLoading();
      var id = that.data.isEdit ? that.data.jobId : result.id;
      that.setData({ savedId: id });
      if (that.data.isEdit) {
        wx.showToast({ title: '更新成功', icon: 'success' });
      } else {
        wx.showModal({
          title: '提交成功',
          content: '职位已提交审核，管理员审核通过后即可上线展示',
          confirmText: '知道了',
          success: function() { wx.navigateBack(); }
        });
      }
    }).catch(function(e) {
      wx.hideLoading();
      wx.showToast({ title: e.message || '操作失败', icon: 'none' });
    }).finally(function() {
      that.setData({ submitting: false });
    });
  },

  preview: function() {
    var id = this.data.savedId || this.data.jobId;
    if (!id) {
      wx.showToast({ title: '请先保存', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id + '&from=enterprise' });
  },

  goBack: function() {
    wx.navigateBack();
  }
});
