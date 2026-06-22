var vip = require('../../services/core/vip');

Page({
  data: {
    statusBarHeight: 0,
    isVip: false,
    vipEndTime: '',
    selectedPlan: 'quarter',
    loading: false,
    plans: [
      { key: 'month', name: '月卡', price: '29.9', period: '1个月', tag: '' },
      { key: 'quarter', name: '季卡', price: '69.9', period: '3个月', tag: '推荐' },
      { key: 'year', name: '年卡', price: '199.9', period: '12个月', tag: '最划算' }
    ],
    benefits: [
      { icon: '', title: 'AI岗位推荐', desc: '智能匹配适合职位' },
      { icon: '', title: 'AI简历优化', desc: '一键优化简历内容' },
      { icon: '', title: 'AI模拟面试', desc: '模拟真实面试场景' },
      { icon: '', title: 'AI聊天助手', desc: '求职问题随时问' },
      { icon: '', title: '专属身份标识', desc: 'VIP专属标识' },
      { icon: '', title: '优先推荐', desc: '简历优先展示' }
    ]
  },

  onLoad() {
    var sysInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight || 20
    });
    this._loadVipStatus();
  },

  onShow() {
    this._loadVipStatus();
  },

  _loadVipStatus: function () {
    var that = this;
    vip.getVipStatus().then(function (data) {
      var endTimeStr = '';
      if (data.end_time) {
        var d = new Date(data.end_time);
        endTimeStr = d.getFullYear() + '-' +
          String(d.getMonth() + 1).padStart(2, '0') + '-' +
          String(d.getDate()).padStart(2, '0');
      }
      that.setData({
        isVip: data.is_vip,
        vipEndTime: endTimeStr
      });
    }).catch(function () {
      that.setData({
        isVip: vip.isVip(),
        vipEndTime: ''
      });
    });
  },

  selectPlan(e) {
    var key = e.currentTarget.dataset.key;
    this.setData({ selectedPlan: key });
  },

  handleBuy() {
    if (this.data.isVip) {
      wx.showToast({ title: '您已是VIP会员', icon: 'none' });
      return;
    }
    var that = this;
    var plan = this.data.selectedPlan;
    wx.showModal({
      title: '确认开通',
      content: '确定要开通' + this._getPlanName(plan) + '吗？',
      success: function (res) {
        if (res.confirm) {
          that.setData({ loading: true });
          vip.subscribe(plan).then(function (data) {
            that.setData({
              isVip: true,
              loading: false,
              vipEndTime: that._formatDate(data.end_time)
            });
            wx.showToast({ title: '开通成功', icon: 'success' });
          }).catch(function (err) {
            that.setData({ loading: false });
            wx.showToast({ title: err.message || '开通失败', icon: 'none' });
          });
        }
      }
    });
  },

  _getPlanName: function (key) {
    var plans = this.data.plans;
    for (var i = 0; i < plans.length; i++) {
      if (plans[i].key === key) return plans[i].name;
    }
    return '';
  },

  _formatDate: function (dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  },

  goBack() {
    wx.navigateBack();
  }
});
