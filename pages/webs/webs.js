const { jobs } = require('../../utils/api.js');

Page({
  data: {
    statusBarHeight: 44,
    searchKeyword: '',
    activeFilter: 'latest',
    filters: [
      { id: 'latest', name: '最新', hasArrow: false },
      { id: 'nearby', name: '附近', hasArrow: false },
      { id: 'area', name: '区域', hasArrow: true },
      { id: 'category', name: '分类', hasArrow: true },
      { id: 'salary', name: '薪资', hasArrow: true },
      { id: 'filter', name: '筛选', hasArrow: true }
    ],
    jobs: [],
    loading: false,
    page: 1,
    pageSize: 10,
    hasMore: true,
    filterParams: {}
  },

  onLoad: function (options) {
    var sysInfo = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 44 });
    this.loadJobs();
  },

  loadJobs: async function () {
    if (!this.data.hasMore || this.data.loading) return;

    this.setData({ loading: true });

    try {
      var params = Object.assign({
        page: this.data.page,
        pageSize: this.data.pageSize
      }, this.data.filterParams);

      if (this.data.searchKeyword) {
        params.keyword = this.data.searchKeyword;
      }

      var result = await jobs.getAll(params);
      var list = result.data || [];

      this.setData({
        jobs: this.data.jobs.concat(list),
        loading: false,
        page: this.data.page + 1,
        hasMore: list.length >= this.data.pageSize
      });
    } catch (error) {
      console.error('加载职位失败:', error);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  onSearchInput: function (e) {
    this.setData({ searchKeyword: e.detail.value });
  },

  onSearch: function () {
    this.setData({ jobs: [], page: 1, hasMore: true });
    this.loadJobs();
  },

  switchFilter: function (e) {
    var id = e.currentTarget.dataset.id;
    this.setData({ activeFilter: id });

    if (id === 'area') {
      this.showAreaPicker();
    } else if (id === 'category') {
      this.showCategoryPicker();
    } else if (id === 'salary') {
      this.showSalaryPicker();
    } else if (id === 'filter') {
      this.showFilterModal();
    } else {
      this.setData({ filterParams: {} });
      this.setData({ jobs: [], page: 1, hasMore: true });
      this.loadJobs();
    }
  },

  showAreaPicker: function () {
    var that = this;
    var areas = ['全部', '大东区', '铁西区', '和平区', '皇姑区', '沈河区', '于洪区', '浑南新区'];
    wx.showActionSheet({
      itemList: areas,
      success: function (res) {
        var area = areas[res.tapIndex];
        if (area !== '全部') {
          that.setData({ filterParams: Object.assign({}, that.data.filterParams, { area: area }) });
        } else {
          var params = Object.assign({}, that.data.filterParams);
          delete params.area;
          that.setData({ filterParams: params });
        }
        that.setData({ jobs: [], page: 1, hasMore: true });
        that.loadJobs();
      }
    });
  },

  showCategoryPicker: function () {
    var that = this;
    var categories = ['全部', '市场销售', '行政人事', '客户服务', '普工技工', '财务审计', '文职文员'];
    wx.showActionSheet({
      itemList: categories,
      success: function (res) {
        var category = categories[res.tapIndex];
        if (category !== '全部') {
          that.setData({ filterParams: Object.assign({}, that.data.filterParams, { category: category }) });
        } else {
          var params = Object.assign({}, that.data.filterParams);
          delete params.category;
          that.setData({ filterParams: params });
        }
        that.setData({ jobs: [], page: 1, hasMore: true });
        that.loadJobs();
      }
    });
  },

  showSalaryPicker: function () {
    var that = this;
    var salaries = ['全部', '3000以下', '3000-5000', '5000-8000', '8000以上'];
    wx.showActionSheet({
      itemList: salaries,
      success: function (res) {
        var salary = salaries[res.tapIndex];
        if (salary !== '全部') {
          that.setData({ filterParams: Object.assign({}, that.data.filterParams, { salary: salary }) });
        } else {
          var params = Object.assign({}, that.data.filterParams);
          delete params.salary;
          that.setData({ filterParams: params });
        }
        that.setData({ jobs: [], page: 1, hasMore: true });
        that.loadJobs();
      }
    });
  },

  showFilterModal: function () {
    wx.showToast({ title: '筛选功能开发中', icon: 'none' });
  },

  onReachBottom: function () {
    this.loadJobs();
  },

  goDetail: function (e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
  },

  callPhone: function (e) {
    var phone = e.currentTarget.dataset.phone;
    wx.makePhoneCall({ phoneNumber: phone });
  },

  formatTime: function (dateStr) {
    if (!dateStr) return '未知';
    var now = new Date();
    var date = new Date(dateStr);
    var diff = now.getTime() - date.getTime();
    var minutes = Math.floor(diff / 60000);
    var hours = Math.floor(diff / 3600000);
    var days = Math.floor(diff / 86400000);

    if (minutes < 60) return minutes + '分钟前';
    if (hours < 24) return hours + '小时前';
    if (days < 7) return days + '天前';
    
    var month = date.getMonth() + 1;
    var day = date.getDate();
    return month + '月' + day + '日';
  }
});
