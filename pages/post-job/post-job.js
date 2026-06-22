var api = require('../../utils/api');

Page({
  data: {
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
    savedId: null,
    progress: 0,
    experienceOptions: [
      { label: '不限', value: '' },
      { label: '1年以下', value: '1年以下' },
      { label: '1-3年', value: '1-3年' },
      { label: '3-5年', value: '3-5年' },
      { label: '5-10年', value: '5-10年' },
      { label: '10年以上', value: '10年以上' }
    ],
    educationOptions: [
      { label: '不限', value: '' },
      { label: '高中', value: '高中' },
      { label: '大专', value: '大专' },
      { label: '本科', value: '本科' },
      { label: '硕士', value: '硕士' },
      { label: '博士', value: '博士' }
    ],
    salaryRanges: [
      { label: '5-10K', min: 5, max: 10 },
      { label: '10-15K', min: 10, max: 15 },
      { label: '15-20K', min: 15, max: 20 },
      { label: '20-30K', min: 20, max: 30 },
      { label: '30-50K', min: 30, max: 50 },
      { label: '50K+', min: 50, max: 100 }
    ],
    tagGroups: [
      {
        category: '前端',
        tags: ['Vue', 'React', 'Angular', '小程序', 'H5', 'TypeScript', 'JavaScript']
      },
      {
        category: '后端',
        tags: ['Java', 'Python', 'Go', 'Node.js', 'PHP', 'C++', 'Rust']
      },
      {
        category: '数据',
        tags: ['MySQL', 'Redis', 'MongoDB', 'Elasticsearch', '数据分析']
      },
      {
        category: '运维/云',
        tags: ['Docker', 'K8s', 'AWS', 'Linux', 'Nginx']
      },
      {
        category: 'AI/产品',
        tags: ['AI', '机器学习', '产品设计', 'UI/UX', '运营', '销售', '市场']
      }
    ]
  },

  onLoad: function(options) {
    if (options && options.id) {
      this.setData({ isEdit: true, jobId: options.id });
      this.loadJob(options.id);
    } else {
      this._updateProgress();
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
      that._updateProgress();
      wx.hideLoading();
    }).catch(function(e) {
      wx.hideLoading();
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
    });
  },

  onInput: function(e) {
    var field = e.currentTarget.dataset.field;
    var value = e.detail.value;
    var obj = {};
    obj[field] = value;
    this.setData(obj);
    this._updateProgress();
  },

  onExperienceChange: function(e) {
    var option = this.data.experienceOptions[e.detail.value];
    this.setData({ 'form.experience': option ? option.value : '' });
    this._updateProgress();
  },

  onEducationChange: function(e) {
    var option = this.data.educationOptions[e.detail.value];
    this.setData({ 'form.education': option ? option.value : '' });
    this._updateProgress();
  },

  selectSalary: function(e) {
    var min = e.currentTarget.dataset.min;
    var max = e.currentTarget.dataset.max;
    this.setData({
      'form.salary_min': String(min),
      'form.salary_max': String(max)
    });
    this._updateProgress();
  },

  salaryChipActive: function(item) {
    return String(this.data.form.salary_min) === String(item.min) &&
           String(this.data.form.salary_max) === String(item.max);
  },

  toggleTag: function(e) {
    var tag = e.currentTarget.dataset.value;
    var tags = this.data.form.tags.slice();
    var idx = tags.indexOf(tag);
    if (idx === -1) {
      if (tags.length >= 10) {
        wx.showToast({ title: '最多选择10个标签', icon: 'none' });
        return;
      }
      tags.push(tag);
    } else {
      tags.splice(idx, 1);
    }
    this.setData({ 'form.tags': tags });
    this._updateProgress();
  },

  _updateProgress: function() {
    var f = this.data.form;
    var total = 4; // 职位名称、薪资、地点、描述
    var filled = 0;
    if (f.title) filled++;
    if (f.salary_min && f.salary_max) filled++;
    if (f.location) filled++;
    if (f.description) filled++;
    var progress = Math.round((filled / total) * 100);
    this.setData({ progress: progress });
  },

  submit: function() {
    var that = this;
    var f = that.data.form;

    // 验证
    if (!f.title.trim()) {
      wx.showToast({ title: '请输入职位名称', icon: 'none' });
      return;
    }
    if (!f.location.trim()) {
      wx.showToast({ title: '请输入工作地点', icon: 'none' });
      return;
    }
    if (!f.description.trim()) {
      wx.showToast({ title: '请输入职位描述', icon: 'none' });
      return;
    }
    if (f.salary_min && f.salary_max && Number(f.salary_min) > Number(f.salary_max)) {
      wx.showToast({ title: '最低薪资不能大于最高薪资', icon: 'none' });
      return;
    }

    that.setData({ submitting: true });

    var data = {
      title: f.title.trim(),
      location: f.location.trim(),
      description: f.description.trim(),
      requirements: f.requirements.trim(),
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
      var id = that.data.isEdit ? that.data.jobId : result.id;
      that.setData({ savedId: id });
      if (that.data.isEdit) {
        wx.showToast({ title: '更新成功', icon: 'success' });
      } else {
        wx.showModal({
          title: '发布成功',
          content: '职位已提交审核，审核通过后即可在平台展示',
          confirmText: '我知道了',
          showCancel: false,
          success: function() { wx.navigateBack(); }
        });
      }
    }).catch(function(e) {
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
