var api = require('../../utils/api');
var { resolve } = require('../../utils/image');

Page({
  data: {
    form: { nickname: '', phone: '', avatar: '' },
    saving: false
  },

  onLoad: function() {
    var info = wx.getStorageSync('userInfo') || {};
    this.setData({
      form: {
        nickname: info.nickname || '',
        phone: info.phone || '',
        avatar: info.avatar ? resolve(info.avatar) : ''
      }
    });
  },

  onInput: function(e) {
    var field = e.currentTarget.dataset.field;
    var obj = {};
    obj['form.' + field] = e.detail.value;
    this.setData(obj);
  },

  chooseAvatar: function() {
    var that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function(res) {
        var filePath = res.tempFilePaths[0];
        if (!filePath) return;
        wx.showLoading({ title: '上传中...' });
        var token = wx.getStorageSync('token') || '';
        wx.uploadFile({
          url: api.BASE_URL + '/api/v1/upload/image',
          filePath: filePath,
          name: 'file',
          formData: { type: 'avatar' },
          header: { Authorization: 'Bearer ' + token },
          success: function(uploadRes) {
            try {
              var data = JSON.parse(uploadRes.data);
              if (data.code === 0 || data.code === 200) {
                var url = (data.data && data.data.url) || '';
                if (url) {
                  that.setData({ 'form.avatar': resolve(url) });
                  var userInfo = wx.getStorageSync('userInfo') || {};
                  userInfo.avatar = url;
                  wx.setStorageSync('userInfo', userInfo);
                }
                wx.showToast({ title: '头像已更新', icon: 'success' });
              } else {
                wx.showToast({ title: data.message || '上传失败', icon: 'none' });
              }
            } catch (e) {
              wx.showToast({ title: '上传失败', icon: 'none' });
            }
          },
          fail: function() {
            wx.showToast({ title: '上传失败', icon: 'none' });
          },
          complete: function() {
            wx.hideLoading();
          }
        });
      }
    });
  },

  save: function() {
    var that = this;
    if (that.data.saving) return;
    var form = that.data.form;
    if (!form.nickname.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' }); return;
    }
    that.setData({ saving: true });
    api.request({
      url: '/api/v1/users/profile',
      method: 'PUT',
      data: { nickname: form.nickname.trim(), phone: form.phone.trim() }
    }).then(function() {
      var userInfo = wx.getStorageSync('userInfo') || {};
      userInfo.nickname = form.nickname.trim();
      userInfo.phone = form.phone.trim();
      wx.setStorageSync('userInfo', userInfo);
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(function() { wx.navigateBack(); }, 800);
    }).catch(function(e) {
      wx.showToast({ title: e.message || '保存失败', icon: 'none' });
    }).finally(function() {
      that.setData({ saving: false });
    });
  },

  onShareAppMessage() {
    return { title: '编辑个人资料', path: '/pages/edit-profile/edit-profile' };
  },

  onShareTimeline() {
    return { title: '编辑个人资料' };
  }
});
