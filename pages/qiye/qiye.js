const { enterprises, companies } = require('../../utils/api.js');
const { checkAuth, isAdmin } = require('../../utils/auth-check.js');

Page({
  data: {
    keyword: '',
    activeFilter: 'all',
    filters: [
      { id: 'all', name: '全部' },
      { id: 'verified', name: '已认证' },
      { id: 'hot', name: '热门' },
      { id: 'new', name: '新入驻' }
    ],
    enterprises: [],
    page: 1,
    pageSize: 10,
    loading: false,
    hasMore: true,
    showEmpty: false,
    showNoMore: false,
    isAdmin: false,
    pendingCount: 0
  },

  onLoad() {
    // 检测用户身份
    const authResult = checkAuth(this, { redirectIfEnterprise: true });
    if (authResult.blocked) return;
    
    // 检查是否为管理员
    const admin = isAdmin();
    const filters = [
      { id: 'all', name: '全部' },
      { id: 'verified', name: '已认证' },
      { id: 'hot', name: '热门' },
      { id: 'new', name: '新入驻' }
    ];
    
    if (admin) {
      filters.push({ id: 'pending', name: '待审核' });
    }
    
    this.setData({ isAdmin: admin, filters });
    
    this.loadEnterprises(true);
    if (admin) {
      this.loadPendingCount();
    }
  },

  onShow() {
    // 检测用户身份
    const authResult = checkAuth(this, { redirectIfEnterprise: true });
    if (authResult.blocked) return;
  },

  onPullDownRefresh() {
    this.loadEnterprises(true).finally(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    this.loadEnterprises();
  },

  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  onSearch() {
    this.loadEnterprises(true);
  },

  switchFilter(e) {
    this.setData({ activeFilter: e.currentTarget.dataset.id });
    this.loadEnterprises(true);
  },

  async loadPendingCount() {
    try {
      const result = await companies.list({ status: 'pending', page: 1, limit: 1 });
      this.setData({ pendingCount: result.total || 0 });
    } catch (e) {
      console.error('加载待审核数量失败', e);
    }
  },

  async handleAudit(e) {
    const { id, action } = e.currentTarget.dataset;
    const label = action === 'approved' ? '通过' : '拒绝';
    
    wx.showModal({
      title: '确认操作',
      content: `确定要${label}该企业吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            if (action === 'approved') {
              await companies.approve(id);
            } else {
              await companies.reject(id);
            }
            wx.showToast({ title: `已${label}`, icon: 'success' });
            this.loadEnterprises(true);
            this.loadPendingCount();
          } catch (e) {
            wx.showToast({ title: e.message || '操作失败', icon: 'none' });
          }
        }
      }
    });
  },

  async loadEnterprises(reset = false) {
    if (this.data.loading) return;
    if (!reset && !this.data.hasMore) return;
    const page = reset ? 1 : this.data.page;
    this.setData({ loading: true });
    try {
      let result;
      
      // 管理员审核模式
      if (this.data.isAdmin && this.data.activeFilter === 'pending') {
        result = await companies.list({ 
          status: 'pending', 
          page, 
          limit: this.data.pageSize,
          keyword: this.data.keyword 
        });
        const list = result.list || result.rows || (Array.isArray(result) ? result : []);
        const newEnterprises = reset ? list : this.data.enterprises.concat(list);
        this.setData({
          enterprises: newEnterprises,
          page: page + 1,
          hasMore: list.length >= this.data.pageSize,
          loading: false,
          showEmpty: !this.data.loading && newEnterprises.length === 0,
          showNoMore: !list.length && newEnterprises.length > 0
        });
        return;
      }
      
      // 普通模式
      if (this.data.activeFilter === 'hot') {
        result = await enterprises.getHot();
      } else if (this.data.activeFilter === 'new') {
        result = await enterprises.getNew();
      } else {
        const params = {
          page,
          pageSize: this.data.pageSize,
          keyword: this.data.keyword
        };
        if (this.data.activeFilter === 'verified') {
          params.verified = true;
        }
        result = await enterprises.getAll(params);
      }
      const list = Array.isArray(result) ? result : (result.data || result.list || []);
      const newEnterprises = reset ? list : this.data.enterprises.concat(list);
      this.setData({
        enterprises: newEnterprises,
        page: page + 1,
        hasMore: ['hot', 'new'].includes(this.data.activeFilter) ? false : (list.length >= this.data.pageSize),
        loading: false,
        showEmpty: !this.data.loading && newEnterprises.length === 0,
        showNoMore: !list.length && newEnterprises.length > 0
      });
    } catch (error) {
      this.setData({ loading: false });
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    }
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    const enterprise = this.data.enterprises.find(item => item.id == id);
    if (enterprise) {
      wx.setStorageSync('currentEnterprise', enterprise);
    }
    wx.navigateTo({ url: `/pages/enterprise-detail/enterprise-detail?id=${id}` });
  },

  onShareAppMessage() {
    return { title: '企业招聘', path: '/pages/qiye/qiye' };
  },

  onShareTimeline() {
    return { title: '企业招聘' };
  }
});