var api = require('../../utils/api');

Page({
  data: {
    step: 1,
    role: '',
    nickname: '',
    phone: '',
    companyName: '',
    contactName: '',
    contactPhone: '',
    saving: false
  },

  selectRole: function(e) {
    this.setData({ role: e.currentTarget.dataset.role });
  },

  nextStep: function() {
    if (!this.data.role) {
      wx.showToast({ title: '请选择身份', icon: 'none' });
      return;
    }
    this.setData({ step: 2 });
  },

  prevStep: function() {
    this.setData({ step: 1 });
  },

  onNicknameInput: function(e) { this.setData({ nickname: e.detail.value }); },
  onPhoneInput: function(e) { this.setData({ phone: e.detail.value }); },
  onCompanyInput: function(e) { this.setData({ companyName: e.detail.value }); },
  onContactNameInput: function(e) { this.setData({ contactName: e.detail.value }); },
  onContactPhoneInput: function(e) { this.setData({ contactPhone: e.detail.value }); },

  save: function() {
    var that = this;
    if (that.data.saving) return;
    var nickname = that.data.nickname.trim();
    if (!nickname) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }
    if (that.data.role === 'enterprise' && !that.data.companyName.trim()) {
      wx.showToast({ title: '请输入公司名称', icon: 'none' });
      return;
    }
    if (that.data.role === 'enterprise' && !that.data.contactName.trim()) {
      wx.showToast({ title: '请输入联系人', icon: 'none' });
      return;
    }
    if (that.data.role === 'enterprise' && !that.data.contactPhone.trim()) {
      wx.showToast({ title: '请输入联系电话', icon: 'none' });
      return;
    }

    that.setData({ saving: true });

    var profileData = {
      nickname: nickname,
      phone: that.data.phone.trim(),
      role: that.data.role
    };

    // 保存个人信息
    api.request({
      url: '/api/v1/users/profile',
      method: 'PUT',
      data: profileData
    }).then(function() {
      var userInfo = wx.getStorageSync('userInfo') || {};
      userInfo.nickname = nickname;
      userInfo.phone = that.data.phone.trim();
      userInfo.role = that.data.role;
      wx.setStorageSync('userInfo', userInfo);
      getApp().globalData.userInfo = userInfo;

      // 企业用户 → 创建企业（默认待审核）
      if (that.data.role === 'enterprise') {
        return api.request({
          url: '/api/v1/enterprises',
          method: 'POST',
          data: { name: that.data.companyName.trim(), contact_name: that.data.contactName.trim(), contact_phone: that.data.contactPhone.trim() }
        }).then(function(enterprise) {
          userInfo.company_id = enterprise.id;
          wx.setStorageSync('userInfo', userInfo);
          getApp().globalData.userInfo = userInfo;
          getApp().globalData.isEnterprise = true;
          // 企业待审核 → 跳审核等待页
          wx.redirectTo({ url: '/pages/approval-pending/approval-pending' });
        });
      } else {
        // 求职者 → 直接进首页
        wx.showToast({ title: '欢迎加入', icon: 'success' });
        setTimeout(function() {
          wx.switchTab({ url: '/pages/home/home' });
        }, 800);
      }
    }).catch(function(e) {
      wx.showToast({ title: e.message || '保存失败', icon: 'none' });
    }).finally(function() {
      that.setData({ saving: false });
    });
  }
});
