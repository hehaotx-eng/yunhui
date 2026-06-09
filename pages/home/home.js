// pages/home/home.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    notices: [
      { id: 1, title: '系统将于今晚23:00进行维护升级' },
      { id: 2, title: '新用户注册立享8折优惠' },
      { id: 3, title: '您的订单已发货，请注意查收' }
    ],
    activeId: 1,
    categories: [
      { id: 1, name: '全部', icon: '' },
      { id: 2, name: '市场销售', icon: '' },
      { id: 3, name: '行政人事', icon: '' },
      { id: 4, name: '客户服务', icon: '' },
      { id: 5, name: '普工技工', icon: '' },
      { id: 6, name: '财务审计', icon: '' },
      { id: 7, name: '文职文员', icon: '' },
      { id: 8, name: '直播', icon: '' }
    ],
    jobs: [
      {
        id: 1,
        tag: '推荐',
        title: '急聘普工月入8000（五险+夫妻间+提供食宿）',
        salary: '2230',
        time: '44分钟前',
        welfare: ['不限', '年底双薪', '周末双休', '节日福利'],
        logo: '',
        contact: '昭昭',
        company: '沈阳凯利达供水设备厂',
        verified: true,
        phone: '13800138000'
      },{
        id: 1,
        tag: '推荐',
        title: '急聘普工月入8000（五险+夫妻间+提供食宿）',
        salary: '2230',
        time: '44分钟前',
        welfare: ['不限', '年底双薪', '周末双休', '节日福利'],
        logo: '',
        contact: '昭昭',
        company: '沈阳凯利达供水设备厂',
        verified: true,
        phone: '13800138000'
      },{
        id: 1,
        tag: '推荐',
        title: '急聘普工月入8000（五险+夫妻间+提供食宿）',
        salary: '2230',
        time: '44分钟前',
        welfare: ['不限', '年底双薪', '周末双休', '节日福利'],
        logo: '',
        contact: '昭昭',
        company: '沈阳凯利达供水设备厂',
        verified: true,
        phone: '13800138000'
      }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})