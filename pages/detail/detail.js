var api = require('../../utils/api');
var services = require('../../services/index');
var auth = services.auth;
var enterprise = services.enterprise;
var jobSvc = services.job;
var resolve = require('../../utils/image').resolve;
var cached = require('../../utils/cached-request');

Page({
  data: {
    statusBarHeight: 0,
    id: '',
    detail: null,
    companyJobs: [],
    skeleton: true,
    isFavorite: false,
    isEnterprise: false
  },

  onLoad(options) {
    var app = getApp();
    var isEnterprise = !!(app.globalData && app.globalData.isEnterprise) || options.from === 'enterprise';
    var sys = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: sys.statusBarHeight || 20, id: options.id, isEnterprise: isEnterprise });
    this.loadDetail();
  },

  onShow: function () {
    if (this.data.detail && this.data.detail.id && !this._viewTracked) {
      this._viewTracked = true;
    }
  },

  onPullDownRefresh() {
    cached.bust('/api/v1/jobs/' + this.data.id);
    this.loadDetail().finally(function() { wx.stopPullDownRefresh(); });
  },

  onShareAppMessage() {
    var detail = this.data.detail;
    return {
      title: detail ? detail.title + ' - ' + (detail.enterprise_name || '') : '发现好机会',
      path: '/pages/detail/detail?id=' + this.data.id
    };
  },

  loadDetail: function() {
    var that = this;
    if (!that.data.id) return;
    that.setData({ skeleton: true });

    // 职位详情走缓存，10分钟有效
    var p1 = cached.cachedGet('/api/v1/jobs/' + that.data.id, {}, {
      ttl: 10 * 60 * 1000,
      onUpdate: function(data) {
        if (data && data.company_logo) data.company_logo = resolve(data.company_logo);
        that.setData({ detail: data });
      }
    });
    var p2 = that.data.isEnterprise ? Promise.resolve({ favorited: false }) : api.favorites.check(that.data.id).catch(function() { return { favorited: false }; });

    Promise.all([p1, p2]).then(function(results) {
      var detail = results[0];
      var fav = results[1];
      if (detail.company_logo) detail.company_logo = resolve(detail.company_logo);
      that.setData({ detail: detail, isFavorite: fav.favorited });
      if (detail.vip_required && !auth.isLoggedIn()) {
        wx.showModal({
          title: 'VIP专属岗位',
          content: '该岗位仅对VIP会员开放',
          confirmText: '去开通',
          cancelText: '返回',
          success: function(res) {
            if (res.confirm) wx.navigateTo({ url: '/pages/vip/vip' });
            else wx.navigateBack();
          }
        });
        that.setData({ skeleton: false });
        return;
      }
      if (detail.company_id) {
        that.loadCompanyJobs(detail.company_id);
      }
    }).catch(function(e) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }).finally(function() {
      that.setData({ skeleton: false });
    });
  },

  loadCompanyJobs: function(companyId) {
    var that = this;
    enterprise.getCompanyDetail(companyId).then(function(info) {
      if (info && info.jobs) {
        that.setData({ companyJobs: info.jobs.slice(0, 5) });
      }
    }).catch(function() {});
  },

  goBack: function() {
    wx.navigateBack();
  },

  goCompany: function(e) {
    var id = e.currentTarget.dataset.id;
    if (id) wx.navigateTo({ url: '/pages/enterprise-detail/enterprise-detail?id=' + id });
  },

  goRelated: function(e) {
    var id = e.currentTarget.dataset.id || (e.detail ? e.detail.id : null);
    if (id) wx.redirectTo({ url: '/pages/detail/detail?id=' + id });
  },

  onFavorite: function() {
    var that = this;
    api.favorites.toggle(that.data.id).then(function(result) {
      that.setData({ isFavorite: result.favorited });
      wx.showToast({ title: result.favorited ? '已收藏' : '已取消收藏', icon: 'none' });
    }).catch(function(e) {
      wx.showToast({ title: e.message || '操作失败', icon: 'none' });
    });
  },

  onShare: function() {},

  onChat: function() {
    if (!auth.isLoggedIn()) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    var that = this;
    var detail = that.data.detail;
    if (!detail || !detail.enterprise_id) {
      wx.showToast({ title: '无法发起聊天', icon: 'none' });
      return;
    }

    var userInfo = wx.getStorageSync('userInfo') || {};
    var currentUserId = userInfo.id ? String(userInfo.id) : '';
    var targetAvatar = detail.company_logo || '';
    var targetName = detail.enterprise_name || detail.company_name || '';

    wx.showLoading({ title: '连接中...' });
    api.chat.createConversation(detail.enterprise_id).then(function(conv) {
      if (conv && conv.id) {
        var jobContent = JSON.stringify({
          type: 'job',
          id: detail.id,
          title: detail.title || '',
          company: detail.company_name || detail.enterprise_name || '',
          salary: detail.salary || (detail.salary_min && detail.salary_max ? detail.salary_min + '-' + detail.salary_max + '元/月' : ''),
          location: detail.location || ''
        });
        api.chat.sendMessage(conv.id, jobContent, 'job').then(function() {
          wx.hideLoading();
          wx.navigateTo({
            url: '/pages/chat/chat?conversationId=' + conv.id +
              '&currentUserId=' + encodeURIComponent(currentUserId) +
              '&targetAvatar=' + encodeURIComponent(targetAvatar) +
              '&targetName=' + encodeURIComponent(targetName)
          });
        }).catch(function() {
          wx.hideLoading();
          wx.navigateTo({
            url: '/pages/chat/chat?conversationId=' + conv.id +
              '&currentUserId=' + encodeURIComponent(currentUserId) +
              '&targetAvatar=' + encodeURIComponent(targetAvatar) +
              '&targetName=' + encodeURIComponent(targetName)
          });
        });
      } else {
        wx.hideLoading();
        wx.showToast({ title: '创建会话失败', icon: 'none' });
      }
    }).catch(function(e) {
      wx.hideLoading();
      wx.showToast({ title: e.message || '操作失败', icon: 'none' });
    });
  },

  onApply: function() {
    if (!auth.isLoggedIn()) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    jobSvc.applyToJob(this.data.id).then(function() {
      wx.showToast({ title: '已表达兴趣', icon: 'success' });
    }).catch(function(e) {
      wx.showToast({ title: e.message || '操作失败', icon: 'none' });
    });
  },

  onManage: function() {
    var that = this;
    var detail = that.data.detail;
    if (!detail) return;

    if (detail.audit_status === 'pending') {
      wx.showToast({ title: '审核中，暂不可操作', icon: 'none' });
      return;
    }
    if (detail.audit_status === 'rejected') {
      wx.showToast({ title: '审核未通过，无法上线', icon: 'none' });
      return;
    }

    var items = [];
    var status = detail.status;
    if (status === 'online') {
      items.push('下线职位');
    } else {
      items.push('上线职位');
    }
    items.push('查看投递');
    wx.showActionSheet({
      itemList: items,
      success: function(res) {
        if (res.tapIndex === 0) {
          var newStatus = status === 'online' ? 'offline' : 'online';
          var text = newStatus === 'online' ? '上线' : '下线';
          wx.showModal({
            title: '确认' + text,
            content: '确定要' + text + '这个职位吗？',
            success: function(modal) {
              if (modal.confirm) {
                api.jobs.update(detail.id, { status: newStatus }).then(function() {
                  wx.showToast({ title: '已' + text, icon: 'success' });
                  that.loadDetail();
                }).catch(function(e) {
                  wx.showToast({ title: e.message || '操作失败', icon: 'none' });
                });
              }
            }
          });
        } else if (res.tapIndex === 1) {
          wx.navigateTo({ url: '/pages/enterprise-applications/enterprise-applications' });
        }
      }
    });
  }
});
