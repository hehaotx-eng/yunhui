var api = require('../../utils/api');
var auth = require('../../services/core/auth');
var vip = require('../../services/core/vip');

var INTENT_MAP = {
  'daily': '日结工作',
  'parttime': '兼职工作',
  'fulltime': '全职工作',
  'intern': '实习工作',
  'nearby': '附近工作'
};

Page({
  data: {
    statusBarHeight: 0,
    inputValue: '',
    messages: [],
    scrollToId: '',
    msgIdCounter: 0
  },

  onLoad: function() {
    var sysInfo = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20 });
    this._loadHistory();
  },

  onHide: function() {
    this._saveHistory();
  },

  _getHistoryKey: function() {
    var userId = '';
    try { var info = wx.getStorageSync('userInfo'); if (info && info.id) userId = info.id; } catch(e) {}
    return 'ai_conv_' + userId;
  },

  _loadHistory: function() {
    var key = this._getHistoryKey();
    var history = [];
    try { history = wx.getStorageSync(key) || []; } catch(e) {}
    if (history.length > 0) {
      this.setData({ messages: history, msgIdCounter: history.length });
    }
  },

  _saveHistory: function() {
    var key = this._getHistoryKey();
    var maxLen = 20;
    var msgs = this.data.messages;
    var toSave = [];
    for (var i = 0; i < msgs.length; i++) {
      var m = msgs[i];
      if (m.type === 'user') {
        toSave.push({ id: m.id, type: 'user', text: m.text });
      } else if (m.type === 'assistant' && !m.loading) {
        toSave.push({
          id: m.id, type: 'assistant',
          userText: m.userText,
          analysis: m.analysis,
          jobs: m.jobs,
          noResult: m.noResult,
          loading: false
        });
      }
    }
    if (toSave.length > maxLen) toSave = toSave.slice(toSave.length - maxLen);
    try { wx.setStorageSync(key, toSave); } catch(e) {}
  },

  onInput: function(e) {
    this.setData({ inputValue: e.detail.value });
  },

  sendMessage: function() {
    var that = this;
    var text = this.data.inputValue.trim();
    if (!text) return;

    if (!auth.isLoggedIn()) {
      wx.showModal({
        title: '登录提示',
        content: '登录后才能使用AI助手，是否立即登录？',
        confirmText: '去登录',
        cancelText: '暂不登录',
        success: function(res) {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/login/login' });
          }
        }
      });
      return;
    }

    if (!vip.isVip()) {
      wx.showModal({
        title: '会员专享',
        content: 'AI求职助手是VIP会员专属功能，开通后即可使用',
        confirmText: '立即开通',
        cancelText: '暂不开通',
        success: function(res) {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/vip/vip' });
          }
        }
      });
      return;
    }

    // 添加用户消息
    var userMsgId = 'user_' + this.data.msgIdCounter;
    var userMsg = {
      id: userMsgId,
      type: 'user',
      text: text
    };

    // 添加AI加载消息
    var aiMsgId = 'ai_' + (this.data.msgIdCounter + 1);
    var aiMsg = {
      id: aiMsgId,
      type: 'assistant',
      loading: true,
      userText: text
    };

    this.setData({
      messages: this.data.messages.concat([userMsg, aiMsg]),
      inputValue: '',
      msgIdCounter: this.data.msgIdCounter + 2,
      scrollToId: 'msg-' + aiMsgId
    });

    // 构建历史消息上下文
    var history = [];
    var msgs = this.data.messages;
    for (var hi = 0; hi < msgs.length; hi++) {
      var hm = msgs[hi];
      if (hm.type === 'user') {
        history.push({ role: 'user', text: hm.text });
      } else if (hm.type === 'assistant' && !hm.loading && hm.analysis) {
        history.push({ role: 'assistant', text: hm.userText || '', analysis: hm.analysis });
      }
    }

    // 调用AI分析接口
    api.aiAssistant.analyze(text, history).then(function(result) {
      that.processResult(aiMsgId, result);
    }).catch(function(err) {
      that.updateMessage(aiMsgId, {
        loading: false,
        noResult: true
      });
    });
  },

  reAnalyze: function(e) {
    var that = this;
    var msgId = e.currentTarget.dataset.id;
    var text = e.currentTarget.dataset.text;

    if (!text) return;

    // 重置为加载状态
    this.updateMessage(msgId, {
      loading: true,
      analysis: null,
      jobs: [],
      noResult: false
    });

    // 重新调用AI分析接口
    api.aiAssistant.analyze(text, []).then(function(result) {
      that.processResult(msgId, result);
    }).catch(function(err) {
      that.updateMessage(msgId, {
        loading: false,
        noResult: true
      });
    });
  },

  processResult: function(msgId, result) {
    var analysis = null;
    var jobs = [];

    if (result) {
      // 解析分析结果
      analysis = {
        intent: result.intent || 'fulltime',
        intent_text: INTENT_MAP[result.intent] || '全职工作',
        confidence: Math.round((result.confidence || 0.5) * 100),
        job_type: (result.user_profile || {}).job_type || '',
        skills_text: ((result.user_profile || {}).skills || []).join('、'),
        salary: (result.user_profile || {}).salary_expectation || '',
        reason: result.recommend_reason || ''
      };

      // 解析职位列表
      var platformJobs = result.platform_jobs || [];
      jobs = platformJobs.map(function(job) {
        var salaryText = '面议';
        if (job.salary_min && job.salary_max) {
          salaryText = job.salary_min + '-' + job.salary_max + '元/月';
        } else if (job.salary_min) {
          salaryText = job.salary_min + '元/月起';
        }

        return {
          id: job.id,
          title: job.title,
          company_name: job.company_name || '企业',
          location: job.location || '',
          salary_text: salaryText,
          match_score: job.match_score || 0,
          match_reason: job.match_reason || '',
          tags: Array.isArray(job.tags) ? job.tags.slice(0, 3) : []
        };
      });
    }

    this.updateMessage(msgId, {
      loading: false,
      analysis: analysis,
      jobs: jobs,
      noResult: jobs.length === 0
    });
  },

  updateMessage: function(msgId, data) {
    var messages = this.data.messages;
    for (var i = 0; i < messages.length; i++) {
      if (messages[i].id === msgId) {
        var key = 'messages[' + i + ']';
        var updateData = {};
        for (var k in data) {
          updateData[key + '.' + k] = data[k];
        }
        this.setData(updateData);
        break;
      }
    }

    // 滚动到底部
    var that = this;
    setTimeout(function() {
      that.setData({ scrollToId: 'msg-bottom' });
    }, 100);
  },

  goDetail: function(e) {
    var id = e.currentTarget.dataset.id;
    if (id) {
      wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
    }
  },

  goBack: function() {
    wx.navigateBack();
  },

  onShareAppMessage() {
    return { title: 'AI求职助手 - 智能匹配岗位', path: '/pages/aiAssistant/aiAssistant' };
  },

  onShareTimeline() {
    return { title: 'AI求职助手 - 智能匹配岗位' };
  }
});
