var api = require('../../utils/api');

var JOB_TYPES = {
  fulltime: { label: '全职', icon: '', desc: '固定月薪' },
  parttime: { label: '兼职', icon: '', desc: '灵活排班' },
  daily:    { label: '日结', icon: '', desc: '当天结算' },
  intern:   { label: '实习', icon: '', desc: '在校实践' }
};

var SALARY_UNITS = {
  fulltime: '元/月',
  parttime: '元/时',
  daily: '元/天',
  intern: '元/月'
};

var SALARY_RANGES = {
  fulltime: [
    { label: '3000-5000', min: 3000, max: 5000 },
    { label: '5000-8000', min: 5000, max: 8000 },
    { label: '8000-12000', min: 8000, max: 12000 },
    { label: '12000-20000', min: 12000, max: 20000 },
    { label: '20000+', min: 20000, max: 50000 }
  ],
  parttime: [
    { label: '20-30/时', min: 20, max: 30 },
    { label: '30-50/时', min: 30, max: 50 },
    { label: '50-80/时', min: 50, max: 80 },
    { label: '80+/时', min: 80, max: 150 }
  ],
  daily: [
    { label: '100-200/天', min: 100, max: 200 },
    { label: '200-300/天', min: 200, max: 300 },
    { label: '300-500/天', min: 300, max: 500 },
    { label: '500+/天', min: 500, max: 1000 }
  ],
  intern: [
    { label: '2000-3000', min: 2000, max: 3000 },
    { label: '3000-5000', min: 3000, max: 5000 },
    { label: '5000-8000', min: 5000, max: 8000 },
    { label: '8000+', min: 8000, max: 15000 }
  ]
};

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
      job_type: 'fulltime',
      experience: '',
      education: '',
      tags: [],
      vip_required: false
    },
    submitting: false,
    savedId: null,
    progress: 0,
    salaryUnit: '元/月',
    salaryRanges: SALARY_RANGES.fulltime,
    jobTypeOptions: [
      { value: 'fulltime', label: '全职', icon: '💼', desc: '固定月薪' },
      { value: 'parttime', label: '兼职', icon: '⏰', desc: '灵活排班' },
      { value: 'daily', label: '日结', icon: '📅', desc: '当天结算' },
      { value: 'intern', label: '实习', icon: '🎓', desc: '在校实践' }
    ],
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
    tagGroups: [
      { category: '技术', tags: ['Vue', 'React', 'Angular', '小程序', 'H5', 'TypeScript', 'JavaScript', 'Java', 'Python', 'Go', 'Node.js', 'PHP', 'C++', 'Rust', 'MySQL', 'Redis', 'MongoDB', 'Docker', 'K8s', 'Linux'] },
      { category: '设计', tags: ['UI设计', 'UX设计', '平面设计', '视觉设计', 'Figma', 'Sketch', 'PS', 'AI', '插画', '动效设计'] },
      { category: '产品/运营', tags: ['产品经理', '产品运营', '用户运营', '内容运营', '新媒体', '短视频', '直播', 'SEO', 'SEM', '数据分析'] },
      { category: '销售/客服', tags: ['销售', '电话销售', '网络销售', '客户经理', '商务拓展', '客服', '售后', '在线客服'] },
      { category: '普工/技工', tags: ['普工', '操作工', '装配工', '焊工', '电工', '维修工', '叉车工', '搬运工', '包装工', '质检员'] },
      { category: '服务业', tags: ['餐饮', '酒店', '保洁', '保安', '快递', '外卖', '骑手', '家政', '美容', '美发'] }
    ],
    tagInput: '',
    showTagModal: false,
    activeTagCategory: 0
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
      var type = job.job_type || 'fulltime';
      if (type === 'normal' || type === 'premium') type = 'fulltime';
      that.setData({
        form: {
          title: job.title || '',
          salary_min: job.salary_min ? String(job.salary_min) : '',
          salary_max: job.salary_max ? String(job.salary_max) : '',
          location: job.location || '',
          description: job.description || '',
          requirements: job.requirements || '',
          job_type: type,
          experience: job.experience || '',
          education: job.education || '',
          tags: job.tags || []
        },
        salaryUnit: SALARY_UNITS[type] || '元/月',
        salaryRanges: SALARY_RANGES[type] || SALARY_RANGES.fulltime
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

  setVip: function(e) {
    var value = e.currentTarget.dataset.value === 'true';
    this.setData({ 'form.vip_required': value });
  },

  selectJobType: function(e) {
    var value = e.currentTarget.dataset.value;
    this.setData({
      'form.job_type': value,
      salaryUnit: SALARY_UNITS[value] || '元/月',
      salaryRanges: SALARY_RANGES[value] || SALARY_RANGES.fulltime,
      'form.salary_min': '',
      'form.salary_max': ''
    });
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

  onTagInput: function(e) {
    this.setData({ tagInput: e.detail.value });
  },

  addCustomTag: function() {
    var tag = this.data.tagInput.trim();
    if (!tag) return;
    var tags = this.data.form.tags.slice();
    if (tags.indexOf(tag) !== -1) {
      wx.showToast({ title: '标签已存在', icon: 'none' });
      return;
    }
    if (tags.length >= 10) {
      wx.showToast({ title: '最多选择10个标签', icon: 'none' });
      return;
    }
    tags.push(tag);
    this.setData({ 'form.tags': tags, tagInput: '' });
    this._updateProgress();
  },

  showTagPicker: function() {
    this.setData({ showTagModal: true });
  },

  hideTagPicker: function() {
    this.setData({ showTagModal: false });
  },

  switchTagCategory: function(e) {
    this.setData({ activeTagCategory: e.currentTarget.dataset.index });
  },

  _updateProgress: function() {
    var f = this.data.form;
    var total = 5;
    var filled = 0;
    if (f.title) filled++;
    if (f.job_type) filled++;
    if (f.salary_min && f.salary_max) filled++;
    if (f.location) filled++;
    if (f.description) filled++;
    this.setData({ progress: Math.round((filled / total) * 100) });
  },

  submit: function() {
    var that = this;
    var f = that.data.form;

    if (!f.title.trim()) {
      wx.showToast({ title: '请输入职位名称', icon: 'none' }); return;
    }
    if (!f.location.trim()) {
      wx.showToast({ title: '请输入工作地点', icon: 'none' }); return;
    }
    if (!f.description.trim()) {
      wx.showToast({ title: '请输入职位描述', icon: 'none' }); return;
    }
    if (f.salary_min && f.salary_max && Number(f.salary_min) > Number(f.salary_max)) {
      wx.showToast({ title: '最低薪资不能大于最高薪资', icon: 'none' }); return;
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
      salary_max: f.salary_max ? Number(f.salary_max) : 0,
      vip_required: !!f.vip_required
    };

    var promise = that.data.isEdit
      ? api.jobs.update(that.data.jobId, data)
      : api.jobs.create(data);

    promise.then(function(result) {
      var id = that.data.isEdit ? that.data.jobId : result.id;
      that.setData({ savedId: id });
      if (that.data.isEdit) {
        wx.showToast({ title: '更新成功', icon: 'success' });
      } else {
        wx.showModal({
          title: '发布成功',
          content: '职位已提交审核，审核通过后即可展示',
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
    if (!id) { wx.showToast({ title: '请先保存', icon: 'none' }); return; }
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id + '&from=enterprise' });
  },

  goBack: function() {
    wx.navigateBack();
  },

  onShareAppMessage() {
    return { title: '发布职位', path: '/pages/post-job/post-job' };
  },

  onShareTimeline() {
    return { title: '发布职位' };
  }
});
