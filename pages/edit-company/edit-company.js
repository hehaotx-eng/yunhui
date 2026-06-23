var api = require('../../utils/api');
var { resolve } = require('../../utils/image');

Page({
  data: {
    form: { name: '', contact_name: '', contact_phone: '', address: '', description: '', logo: '' },
    saving: false
  },

  onLoad: function() {
    this.loadCompany();
  },

  loadCompany: function() {
    var that = this;
    api.request({ url: '/api/v1/enterprise/company-info' }).then(function(data) {
      if (data) {
        that.setData({
          form: {
            name: data.name || '',
            contact_name: data.contact_name || '',
            contact_phone: data.contact_phone || '',
            address: data.address || '',
            description: data.description || '',
            logo: resolve(data.logo) || ''
          }
        });
      }
    }).catch(function() {});
  },

  chooseLogo: function() {
    var that = this;
    var companyId = '';
    try { var info = wx.getStorageSync('userInfo'); if (info && info.company_id) companyId = info.company_id; } catch(e) {}
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function(res) {
        var tempPath = res.tempFilePaths[0];
        wx.showLoading({ title: '上传中...' });
        var extra = companyId ? { company_id: companyId } : {};
        api.upload.image(tempPath, 'company_logo', extra).then(function(url) {
          that.setData({ 'form.logo': url });
          wx.hideLoading();
        }).catch(function(e) {
          wx.hideLoading();
          wx.showToast({ title: e.message || '上传失败', icon: 'none' });
        });
      }
    });
  },

  onInput: function(e) {
    var field = e.currentTarget.dataset.field;
    var obj = {};
    obj['form.' + field] = e.detail.value;
    this.setData(obj);
  },

  save: function() {
    var that = this;
    if (that.data.saving) return;
    var form = that.data.form;
    if (!form.name.trim()) {
      wx.showToast({ title: '请输入公司名称', icon: 'none' }); return;
    }
    that.setData({ saving: true });
    api.request({
      url: '/api/v1/enterprise/company-info',
      method: 'PUT',
      data: {
        name: form.name.trim(),
        contact_name: form.contact_name.trim(),
        contact_phone: form.contact_phone.trim(),
        address: form.address.trim(),
        description: form.description.trim(),
        logo: form.logo || ''
      }
    }).then(function() {
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(function() { wx.navigateBack(); }, 800);
    }).catch(function(e) {
      wx.showToast({ title: e.message || '保存失败', icon: 'none' });
    }).finally(function() {
      that.setData({ saving: false });
    });
  },

  onShareAppMessage() {
    return { title: '编辑企业信息', path: '/pages/edit-company/edit-company' };
  },

  onShareTimeline() {
    return { title: '编辑企业信息' };
  }
});
