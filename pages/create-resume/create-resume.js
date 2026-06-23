const { resumes, universities } = require('../../utils/api');

Page({
  data: {
    currentStep: 0,
    resumeId: null,
    steps: ['基本信息', '求职意向', '教育经历', '技能标签'],
    form: {
      name: '',
      gender: '',
      phone: '',
      email: '',
      location: '',
      birthDate: '',
      expectedJob: '',
      expectedSalary: '',
      workType: '全职',
      expectedCity: '',
      school: '',
      major: '',
      education: '',
      startDate: '',
      endDate: '',
      skills: []
    },
    skillInput: '',
    loading: false,
    hasExisting: false,
    schoolSuggestions: [],
    showSchoolDropdown: false
  },

  onLoad(options) {
    const app = getApp();
    const userInfo = app.globalData.userInfo;
    if (userInfo) {
      const prefill = {};
      if (userInfo.nickname) prefill.name = userInfo.nickname;
      if (userInfo.phone) prefill.phone = userInfo.phone;
      if (Object.keys(prefill).length > 0) {
        this.setData({ form: { ...this.data.form, ...prefill } });
      }
    }

    if (options.id) {
      this.setData({ resumeId: options.id });
      this.loadResume(options.id);
    } else {
      this.checkDraft();
    }
  },

  async loadResume(id) {
    wx.showLoading({ title: '加载中...' });
    try {
      const data = await resumes.getById(id);
      if (data && data.content) {
        this.setData({ form: { ...this.data.form, ...data.content } });
      }
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  onFieldChange(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onGenderChange(e) {
    const idx = parseInt(e.detail.value);
    this.setData({ 'form.gender': idx === 0 ? '男' : '女' });
  },

  onWorkTypeChange(e) {
    const value = e.currentTarget.dataset.value;
    this.setData({ 'form.workType': value });
  },

  onEducationChange(e) {
    const idx = parseInt(e.detail.value);
    const arr = ['高中', '大专', '本科', '硕士', '博士'];
    this.setData({ 'form.education': arr[idx] || '' });
  },

  onSkillInput(e) {
    this.setData({ skillInput: e.detail.value });
  },

  addSkill() {
    const val = this.data.skillInput.trim();
    if (!val) return;
    if (this.data.form.skills.length >= 10) {
      wx.showToast({ title: '最多添加10个技能', icon: 'none' });
      return;
    }
    if (this.data.form.skills.includes(val)) {
      wx.showToast({ title: '已添加该技能', icon: 'none' });
      return;
    }
    this.setData({
      'form.skills': [...this.data.form.skills, val],
      skillInput: ''
    });
  },

  removeSkill(e) {
    const idx = e.currentTarget.dataset.index;
    const skills = this.data.form.skills.filter((_, i) => i !== idx);
    this.setData({ 'form.skills': skills });
  },

  onDateChange(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onSchoolInput(e) {
    const value = e.detail.value;
    this.setData({ 'form.school': value });

    if (value.trim().length < 1) {
      this.setData({ schoolSuggestions: [], showSchoolDropdown: false });
      return;
    }

    clearTimeout(this._schoolTimer);
    this._schoolTimer = setTimeout(async () => {
      try {
        const list = await universities.search(value.trim());
        this.setData({
          schoolSuggestions: Array.isArray(list) ? list : [],
          showSchoolDropdown: Array.isArray(list) && list.length > 0
        });
      } catch {
        this.setData({ schoolSuggestions: [], showSchoolDropdown: false });
      }
    }, 200);
  },

  onSchoolSelect(e) {
    const data = e.currentTarget.dataset;
    this.setData({
      'form.school': data.name,
      'form.education': data.level || '',
      schoolSuggestions: [],
      showSchoolDropdown: false
    });
  },

  onSchoolBlur() {
    setTimeout(() => {
      this.setData({ showSchoolDropdown: false });
    }, 200);
  },

  onSchoolFocus() {
    if (this.data.schoolSuggestions.length > 0) {
      this.setData({ showSchoolDropdown: true });
    }
  },

  prevStep() {
    if (this.data.currentStep > 0) {
      this.setData({ currentStep: this.data.currentStep - 1 });
    }
  },

  nextStep() {
    if (!this.validateStep(this.data.currentStep)) return;
    if (this.data.currentStep < this.data.steps.length - 1) {
      this.setData({ currentStep: this.data.currentStep + 1 });
    } else {
      this.submitResume();
    }
  },

  validateStep(step) {
    const f = this.data.form;
    switch (step) {
      case 0:
        if (!f.name) { wx.showToast({ title: '请输入姓名', icon: 'none' }); return false; }
        if (!f.phone) { wx.showToast({ title: '请输入手机号', icon: 'none' }); return false; }
        if (!f.email) { wx.showToast({ title: '请输入邮箱', icon: 'none' }); return false; }
        return true;
      case 1:
        if (!f.expectedJob) { wx.showToast({ title: '请输入期望职位', icon: 'none' }); return false; }
        if (!f.expectedSalary) { wx.showToast({ title: '请输入期望薪资', icon: 'none' }); return false; }
        return true;
      case 2:
        if (!f.school) { wx.showToast({ title: '请输入学校名称', icon: 'none' }); return false; }
        return true;
      case 3:
        return true;
      default:
        return true;
    }
  },

  async submitResume() {
    this.setData({ loading: true });
    wx.showLoading({ title: '保存中...' });
    try {
      const form = this.data.form;
      let resumeId = this.data.resumeId;
      if (resumeId) {
        await resumes.update(resumeId, form);
      } else {
        const result = await resumes.create(form);
        resumeId = result.id;
      }
      wx.hideLoading();
      wx.removeStorageSync('resume_draft');
      wx.redirectTo({ url: `/pages/resume-preview/resume-preview?id=${resumeId}` });
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: e.message || '保存失败', icon: 'error' });
    } finally {
      this.setData({ loading: false });
    }
  },

  goBack() {
    if (this.hasFormData()) {
      wx.setStorageSync('resume_draft', this.data.form);
    }
    wx.navigateBack();
  },

  hasFormData() {
    const f = this.data.form;
    return f.name || f.phone || f.email || f.expectedJob || f.school || f.skills.length > 0;
  },

  checkDraft() {
    const draft = wx.getStorageSync('resume_draft');
    if (draft && draft.name) {
      this.setData({ hasExisting: true });
    }
  },

  continueEditing() {
    const draft = wx.getStorageSync('resume_draft');
    if (draft) {
      this.setData({ form: { ...this.data.form, ...draft }, hasExisting: false });
    }
  },

  startFresh() {
    wx.removeStorageSync('resume_draft');
    this.setData({ hasExisting: false });
  },

  onShareAppMessage() {
    return { title: '创建简历 - 完善个人信息', path: '/pages/create-resume/create-resume' };
  },

  onShareTimeline() {
    return { title: '创建简历 - 完善个人信息' };
  }
});
