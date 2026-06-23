var { resumes, request, chat } = require('../../utils/api');
var { resolve } = require('../../utils/image');

Page({
  data: {
    resumeId: null,
    resume: null,
    loading: true,
    from: '',
    avatar: '',
    displayPhone: '',
    isFav: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ resumeId: options.id, from: options.from || '' });
      this.loadResume(options.id, options.from);
    }
  },

  goBack() {
    wx.navigateBack();
  },

  async loadResume(id, from) {
    this.setData({ loading: true });
    try {
      var data;
      if (from === 'enterprise') {
        data = await request({ url: '/api/v1/enterprise/resume/' + id });
      } else {
        data = await resumes.getById(id);
      }
      if (!data) {
        this.setData({ resume: null, loading: false });
        wx.showToast({ title: '简历不存在', icon: 'none' });
        return;
      }
      this.setData({ resume: data, avatar: data.avatar ? resolve(data.avatar) : '', loading: false });
      if (data.content && data.content.phone) {
        this.setData({ displayPhone: this.maskPhone(data.content.phone) });
      }
      if (from === 'enterprise') {
        this.checkFav(data.id);
      }
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  maskPhone(phone) {
    if (!phone || phone.length < 7) return phone;
    return phone.slice(0, 3) + '****' + phone.slice(-4);
  },

  makeCall(e) {
    var phone = e.currentTarget.dataset.phone;
    if (!phone) return;
    wx.makePhoneCall({
      phoneNumber: phone,
      success: () => {
        request({
          url: '/api/v1/enterprise/resume/' + this.data.resumeId + '/call',
          method: 'POST',
          data: { phone: phone }
        }).catch(function() {});
      }
    });
  },

  contactApplicant() {
    var that = this;
    var resume = this.data.resume;
    var userId = resume && (resume.user_id || (resume.content && resume.content.user_id));
    if (!userId) {
      wx.showToast({ title: '无法获取用户信息', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '加载中...' });
    chat.createConversation(userId).then(function(conv) {
      wx.hideLoading();
      var convId = conv && (conv.id || conv.conversation_id);
      if (convId) {
        wx.navigateTo({ url: '/pages/chat/chat?conversationId=' + convId });
      } else {
        wx.showToast({ title: '创建会话失败', icon: 'none' });
      }
    }).catch(function(e) {
      wx.hideLoading();
      wx.showToast({ title: e.message || '创建会话失败', icon: 'none' });
    });
  },

  checkFav(resumeId) {
    var that = this;
    request({ url: '/api/v1/enterprise/resume/' + resumeId + '/favorite' }).then(function(data) {
      that.setData({ isFav: data.favorited });
    }).catch(function() {});
  },

  toggleFav() {
    var that = this;
    var resumeId = this.data.resume && this.data.resume.id;
    if (!resumeId) return;
    request({
      url: '/api/v1/enterprise/resume/' + resumeId + '/favorite',
      method: 'POST'
    }).then(function(data) {
      that.setData({ isFav: data.favorited });
      wx.showToast({
        title: data.favorited ? '已收藏' : '已取消收藏',
        icon: 'none'
      });
    }).catch(function(e) {
      wx.showToast({ title: e.message || '操作失败', icon: 'none' });
    });
  },

  goEdit() {
    wx.navigateTo({ url: '/pages/create-resume/create-resume?id=' + this.data.resumeId });
  },

  onShareAppMessage() {
    return { title: '简历预览', path: '/pages/resume-preview/resume-preview?id=' + this.data.resumeId };
  },

  onShareTimeline() {
    return { title: '简历预览' };
  }
});
