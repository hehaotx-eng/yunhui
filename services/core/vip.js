var api = require('../../utils/api');

var _cachedVipStatus = null;

function isVip() {
  try {
    var app = getApp();
    var userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
    return !!(userInfo && userInfo.is_vip);
  } catch (e) {
    return false;
  }
}

function checkVip() {
  if (isVip()) {
    return true;
  }
  showVipModal();
  return false;
}

function showVipModal() {
  wx.showModal({
    title: '会员专享',
    content: '开通 VIP 后使用 AI 智能功能',
    confirmText: '立即开通',
    cancelText: '暂不开通',
    success: function (res) {
      if (res.confirm) {
        wx.navigateTo({ url: '/pages/vip/vip' });
      }
    }
  });
}

function getVipStatus() {
  return api.request({ url: '/api/v1/vip/status' }).then(function (data) {
    _cachedVipStatus = data;
    var app = getApp();
    var userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo') || {};
    userInfo.is_vip = data.is_vip;
    userInfo.vip_end_time = data.end_time;
    app.globalData.userInfo = userInfo;
    wx.setStorageSync('userInfo', userInfo);
    return data;
  });
}

function subscribe(plan) {
  return api.request({
    url: '/api/v1/vip/subscribe',
    method: 'POST',
    data: { plan: plan }
  }).then(function (data) {
    _cachedVipStatus = data;
    var app = getApp();
    var userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo') || {};
    userInfo.is_vip = data.is_vip;
    userInfo.vip_end_time = data.end_time;
    app.globalData.userInfo = userInfo;
    wx.setStorageSync('userInfo', userInfo);
    return data;
  });
}

function getVipInfo() {
  try {
    var app = getApp();
    var userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
    return {
      isVip: !!(userInfo && userInfo.is_vip),
      vipEndTime: userInfo ? userInfo.vip_end_time : null,
      userInfo: userInfo
    };
  } catch (e) {
    return { isVip: false, vipEndTime: null, userInfo: null };
  }
}

module.exports = {
  isVip: isVip,
  checkVip: checkVip,
  showVipModal: showVipModal,
  getVipStatus: getVipStatus,
  subscribe: subscribe,
  getVipInfo: getVipInfo
};
