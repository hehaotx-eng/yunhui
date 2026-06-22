var aiService = require('../../services/ai/service');
var auth = require('../../services/core/auth');
var vip = require('../../services/core/vip');
var api = require('../../utils/api');

Page({
  data: {
    statusBarHeight: 0,
    skeleton: true,
    loading: false,
    loadingMore: false,
    list: [],
    filteredList: [],
    page: 1,
    hasMore: false,
    totalCount: 0,
    matchCount: 0,
    isLoggedIn: false,
    isVip: false,
    hasResume: true,
    activeFilter: 'all',
    filters: [
      { key: 'all', label: '全部' },
      { key: 'high', label: '高匹配' },
      { key: 'new', label: '最新' },
      { key: 'salary', label: '薪资优先' }
    ]
  },

  onLoad: function() {
    var sysInfo = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20 });
  },

  onShow: function() {
    this.syncTabBar();
    this.checkStatus();
  },

  onPullDownRefresh: function() {
    this.loadRecommendations().finally(function() { wx.stopPullDownRefresh(); });
  },

  checkStatus: function() {
    var that = this;
    var loggedIn = auth.isLoggedIn();

    if (!loggedIn) {
      this.setData({ isLoggedIn: false, isVip: false, hasResume: true, skeleton: false, list: [], filteredList: [] });
      return;
    }

    // 先用本地缓存的 VIP 状态，避免闪现
    var localVip = vip.isVip();
    this.setData({ isLoggedIn: true, isVip: localVip });

    if (!localVip) {
      // 本地显示非VIP，但后台确认一下（可能刚开通）
      vip.getVipStatus().then(function(data) {
        if (data.is_vip) {
          // 服务器说是VIP，更新本地并加载推荐
          that.setData({ isVip: true });
          that._checkResumeAndLoad();
        }
      }).catch(function() {});
      this.setData({ skeleton: false, list: [], filteredList: [] });
      return;
    }

    // 本地是VIP，直接加载推荐，后台静默同步
    this._checkResumeAndLoad();
    vip.getVipStatus().catch(function() {});
  },

  _checkResumeAndLoad: function() {
    var that = this;
    api.resumes.getMy().then(function(resumes) {
      var list = Array.isArray(resumes) ? resumes : (resumes.list || []);
      if (list.length === 0) {
        that.setData({ hasResume: false, skeleton: false, list: [], filteredList: [] });
      } else {
        that.setData({ hasResume: true });
        that.loadRecommendations();
      }
    }).catch(function() {
      that.setData({ hasResume: true });
      that.loadRecommendations();
    });
  },

  showLoginDialog: function() {
    wx.showModal({
      title: '登录提示',
      content: '登录后才能使用AI推荐功能，是否立即登录？',
      confirmText: '去登录',
      cancelText: '暂不登录',
      success: function(res) {
        if (res.confirm) {
          wx.navigateTo({ url: '/pages/login-phone/login-phone' });
        }
      }
    });
  },

  showVipDialog: function() {
    wx.showModal({
      title: '会员专享',
      content: 'AI智能推荐是VIP会员专属功能，开通后即可使用',
      confirmText: '立即开通',
      cancelText: '暂不开通',
      success: function(res) {
        if (res.confirm) {
          wx.navigateTo({ url: '/pages/vip/vip' });
        }
      }
    });
  },

  goCreateResume: function() {
    wx.navigateTo({ url: '/pages/create-resume/create-resume' });
  },

  loadRecommendations: function() {
    var that = this;
    if (!this.data.isLoggedIn || !this.data.hasResume) {
      return Promise.resolve();
    }

    this.setData({ skeleton: true });
    return aiService.getRecommendationFeed().then(function(feed) {
      var list = feed.list || [];
      var totalCount = list.length;
      var matchCount = 0;
      for (var i = 0; i < list.length; i++) {
        var score = (list[i].payload || {}).match_score || 0;
        if (score >= 80) matchCount++;
      }
      that.setData({
        list: list,
        totalCount: totalCount,
        matchCount: matchCount,
        hasMore: false
      });
      that.applyFilter();
    }).catch(function(e) {
      console.error('加载推荐失败:', e);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }).finally(function() {
      that.setData({ skeleton: false });
    });
  },

  onRefresh: function() {
    this.loadRecommendations();
  },

  onFilterTap: function(e) {
    var key = e.currentTarget.dataset.key;
    this.setData({ activeFilter: key });
    this.applyFilter();
  },

  applyFilter: function() {
    var list = this.data.list;
    var filter = this.data.activeFilter;
    var sorted = list.slice();

    if (filter === 'high') {
      sorted = sorted.filter(function(item) {
        return ((item.payload || {}).match_score || 0) >= 80;
      });
    } else if (filter === 'new') {
      sorted.sort(function(a, b) {
        var ta = (a.payload || {}).created_at || '';
        var tb = (b.payload || {}).created_at || '';
        return tb > ta ? 1 : -1;
      });
    } else if (filter === 'salary') {
      sorted.sort(function(a, b) {
        var sa = (a.payload || {}).salary_max || 0;
        var sb = (b.payload || {}).salary_max || 0;
        return sb - sa;
      });
    }

    this.setData({ filteredList: sorted });
  },

  goDetail: function(e) {
    var id = e.detail.id;
    if (id) {
      wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
    }
  },

  goCompany: function(e) {
    var id = e.detail.id;
    if (id) {
      wx.navigateTo({ url: '/pages/enterprise-detail/enterprise-detail?id=' + id });
    }
  },

  goAiAssistant: function() {
    if (!this.data.isLoggedIn) {
      this.showLoginDialog();
      return;
    }
    if (!this.data.isVip) {
      this.showVipDialog();
      return;
    }
    wx.navigateTo({ url: '/pages/aiAssistant/aiAssistant' });
  },

  onCardAction: function(e) {
    var that = this;
    var action = e.detail.action;
    var id = e.detail.id;

    if (!auth.isLoggedIn()) {
      this.showLoginDialog();
      return;
    }

    if (!this.data.isVip) {
      this.showVipDialog();
      return;
    }

    if (action === 'apply') {
      api.applications.apply({ job_id: id }).then(function() {
        wx.showToast({ title: '已投递', icon: 'success' });
        that.removeCard(id);
      }).catch(function(err) {
        wx.showToast({ title: err.message || '投递失败', icon: 'none' });
      });
    } else if (action === 'chat') {
      var card = that.findCard(id);
      var companyId = card ? (card.payload || {}).company_id : '';
      if (companyId) {
        api.chat.createConversation(companyId).then(function(res) {
          var conversationId = res && (res.id || res.conversation_id);
          if (conversationId) {
            wx.navigateTo({ url: '/pages/chat/chat?conversationId=' + conversationId });
          }
        }).catch(function(err) {
          wx.showToast({ title: err.message || '创建会话失败', icon: 'none' });
        });
      }
    } else if (action === 'skip') {
      that.removeCard(id);
      wx.showToast({ title: '已忽略', icon: 'none' });
    }
  },

  findCard: function(jobId) {
    var list = this.data.list;
    for (var i = 0; i < list.length; i++) {
      var payload = list[i].payload || {};
      if (payload.job_id === jobId || payload.id === jobId) {
        return list[i];
      }
    }
    return null;
  },

  removeCard: function(jobId) {
    var list = this.data.list.filter(function(item) {
      var payload = item.payload || {};
      return payload.job_id !== jobId && payload.id !== jobId;
    });
    this.setData({ list: list });
    this.applyFilter();
  },

  syncTabBar: function() {
    var app = getApp();
    var tabBar = this.getTabBar();
    if (tabBar) {
      tabBar.setRole(app.globalData.isEnterprise ? 'enterprise' : 'user');
      tabBar.setSelected(2);
    }
  }
});
