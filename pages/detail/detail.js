const {
  jobs,
  favorites,
  resumes,
  reports,
  conversations
} = require('../../utils/api.js');

Page({
  data: {
    id: '',
    job: null,
    isCollected: false,
    isEnterprise: false
  },

  onLoad(options) {
    this.setData({
      id: options.id
    });
    this.loadDetail();
  },

  onPullDownRefresh() {
    this.loadDetail().finally(() => wx.stopPullDownRefresh());
  },

  async loadDetail() {
    if (!this.data.id) return;
    wx.showLoading({
      title: '加载中'
    });
    try {
      const job = await jobs.getById(this.data.id);
      const userRole = wx.getStorageSync('userRole');
      const isEnterprise = userRole === 'enterprise';
      this.setData({
        job,
        isEnterprise
      });
      await this.checkFavorite();
    } catch (error) {
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  goBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack({
        delta: 1
      })
    } else {
      wx.switchTab({
        url: '/pages/home/home'
      })
    }
  },

  async checkFavorite() {
    if (!wx.getStorageSync('token')) return;
    try {
      const result = await favorites.check(this.data.id);
      this.setData({
        isCollected: !!(result && (result.isFavorite || result.favorited || result.id))
      });
    } catch (error) {}
  },

  requireLogin() {
    if (wx.getStorageSync('token')) return true;
    wx.navigateTo({
      url: '/pages/login/login'
    });
    return false;
  },

  async toggleCollect() {
    if (!this.requireLogin()) return;
    try {
      await favorites.toggle(this.data.id);
      this.setData({
        isCollected: !this.data.isCollected
      });
      wx.showToast({
        title: this.data.isCollected ? '已收藏' : '已取消',
        icon: 'none'
      });
    } catch (error) {
      wx.showToast({
        title: error.message || '操作失败',
        icon: 'none'
      });
    }
  },

  async handleApply() {
    if (!this.requireLogin()) return;
    try {
      await resumes.submit(this.data.id);
      wx.showToast({
        title: '投递成功',
        icon: 'success'
      });
    } catch (error) {
      wx.showToast({
        title: error.message || '投递失败',
        icon: 'none'
      });
    }
  },

  async goChat() {
    if (!this.requireLogin()) return;
    try {
      const conversation = await conversations.create({
        jobId: this.data.id,
        enterpriseId: this.data.job.enterpriseId
      });
      wx.navigateTo({
        url: `/pages/chat/chat?id=${conversation.id}`
      });
    } catch (error) {
      wx.showToast({
        title: error.message || '发起沟通失败',
        icon: 'none'
      });
    }
  },

  goCompany() {
    const id = this.data.job && this.data.job.enterpriseId;
    if (id) wx.navigateTo({
      url: `/pages/enterprise-detail/enterprise-detail?id=${id}`
    });
  },

  callPhone() {
    const phone = this.data.job && this.data.job.contactPhone;
    if (phone) wx.makePhoneCall({
      phoneNumber: phone
    });
  },

  async goReport() {
    if (!this.requireLogin()) return;
    try {
      await reports.create(this.data.id, '职位信息异常');
      wx.showToast({
        title: '举报已提交',
        icon: 'success'
      });
    } catch (error) {
      wx.showToast({
        title: error.message || '举报失败',
        icon: 'none'
      });
    }
  },

  goEdit() {
    wx.navigateTo({
      url: `/pages/post-job/post-job?id=${this.data.id}`
    });
  },

  async handleDelete() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个职位吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await jobs.delete(this.data.id);
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          } catch (error) {
            wx.showToast({
              title: error.message || '删除失败',
              icon: 'none'
            });
          }
        }
      }
    });
  }
});