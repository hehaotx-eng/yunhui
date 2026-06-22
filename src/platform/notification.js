var PlatformNotification = {
  toast: function(title, icon) {
    wx.showToast({ title: title || '', icon: icon || 'none', duration: 2000 });
  },

  loading: function(title) {
    wx.showLoading({ title: title || '加载中...', mask: true });
  },

  hideLoading: function() {
    wx.hideLoading();
  },

  confirm: function(title, content) {
    return new Promise(function(resolve) {
      wx.showModal({
        title: title || '提示',
        content: content || '',
        success: function(res) { resolve(res.confirm); }
      });
    });
  },

  alert: function(content) {
    return this.confirm('提示', content);
  },

  error: function(msg) {
    this.toast(msg || '操作失败', 'none');
  },

  success: function(msg) {
    this.toast(msg || '操作成功', 'success');
  }
};

module.exports = PlatformNotification;
