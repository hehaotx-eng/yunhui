const { auth, resumes, upload } = require('../../utils/api.js');
const { resolve } = require('../../utils/image.js');

Page({
  data: {
    nickname: '',
    avatar: '',
    avatarLetter: '',
    phone: ''
  },

  onLoad() {
    const app = getApp();
    const user = app.globalData.userInfo || {};
    this.setData({
      nickname: user.nickname || '',
      avatar: user.avatar ? resolve(user.avatar) : '',
      avatarLetter: (user.nickname || user.phone || '用').substring(0, 1),
      phone: user.phone || ''
    });
  },

  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value });
  },

  onEditAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const filePath = res.tempFilePaths[0];
        wx.showLoading({ title: '上传中...' });
        try {
          const result = await upload.image(filePath, 'avatar');
          this.setData({ avatar: resolve(result.url) });
          wx.hideLoading();
        } catch (e) {
          wx.hideLoading();
          wx.showToast({ title: e.message || '上传失败', icon: 'none' });
        }
      }
    });
  },

  async saveProfile() {
    const nickname = this.data.nickname.trim();
    if (!nickname) {
      wx.showToast({ title: '昵称不能为空', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中...' });
    try {
      const updated = await auth.updateProfile({ nickname });
      const app = getApp();
      const token = app.globalData.token || wx.getStorageSync('token');

      if (updated.avatar) updated.avatar = resolve(updated.avatar);
      if (this.data.avatar) {
        updated.avatar = this.data.avatar;
      }

      app.updateUserState(updated, token);

      this.syncResumeName(nickname);

      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 800);
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: e.message || '保存失败', icon: 'none' });
    }
  },

  async syncResumeName(name) {
    try {
      const myResumes = await resumes.getMy();
      if (Array.isArray(myResumes) && myResumes.length > 0) {
        const first = myResumes[0];
        const detail = await resumes.getById(first.id);
        if (detail && detail.content) {
          detail.content.name = name;
          await resumes.update(first.id, detail.content);
        }
      }
    } catch (e) {
      console.error('同步简历姓名失败:', e);
    }
  },

  goBack() {
    wx.navigateBack();
  }
});