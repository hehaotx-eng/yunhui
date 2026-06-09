const { conversations, messages, BASE_URL, getToken } = require('../../utils/api.js');

Page({
  data: {
    conversationId: 0,
    conversation: {},
    messages: [],
    inputValue: '',
    myUserId: 0,
    scrollToId: '99999999'
  },

  onLoad: function (options) {
    var userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({ myUserId: userInfo.id });
    }
    this.setData({ conversationId: parseInt(options.id) });
    this.loadConversation();
    this.loadMessages();
    this.startPolling();
  },

  onUnload: function () {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  },

  loadConversation: async function () {
    try {
      var data = await conversations.getById(this.data.conversationId);
      wx.setNavigationBarTitle({ title: data.enterpriseName || '聊天' });
      this.setData({ conversation: data });
      await conversations.markRead(this.data.conversationId);
    } catch (error) {
      console.error('加载会话失败:', error);
    }
  },

  loadMessages: async function () {
    try {
      var result = await messages.getByConversation(this.data.conversationId);
      var list = result.data || [];
      list = this.processTimeFlags(list);
      this.setData({ messages: list });
      if (list.length > 0) {
        var that = this;
        setTimeout(function () {
          that.scrollToBottom();
        }, 300);
      }
    } catch (error) {
      console.error('加载消息失败:', error);
    }
  },


  startPolling: function () {
    var that = this;
    this._timer = setInterval(function () {
      that.pollMessages();
    }, 3000);
  },

  pollMessages: async function () {
    try {
      var result = await messages.getByConversation(this.data.conversationId);
      var list = result.data || [];
      if (list.length > this.data.messages.length) {
        list = this.processTimeFlags(list);
        this.setData({ messages: list });
        this.scrollToBottom(list[list.length - 1].id);
        conversations.markRead(this.data.conversationId);
      }
    } catch (error) {
      console.error('轮询消息失败:', error);
    }
  },

  // 处理时间显示逻辑
  processTimeFlags: function (list) {
    for (var i = 0; i < list.length; i++) {
      var currentTime = new Date(list[i].created_at).getTime();
      var timeText = this.formatTime(list[i].created_at);
      var showTime = true;

      // 和上一条消息对比，3分钟内且时间文字相同则隐藏
      if (i > 0) {
        var prevTime = new Date(list[i - 1].created_at).getTime();
        var diff = currentTime - prevTime;
        var prevTimeText = this.formatTime(list[i - 1].created_at);
        if (diff < 3 * 60 * 1000 && timeText === prevTimeText) {
          showTime = false;
        }
      }

      list[i].showTime = showTime;
      list[i].timeText = timeText;
    }
    return list;
  },

  formatTime: function (dateStr) {
    var date = new Date(dateStr);
    var now = new Date();
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var h = hours < 10 ? '0' + hours : '' + hours;
    var m = minutes < 10 ? '0' + minutes : '' + minutes;
    var time = h + ':' + m;

    var isToday = date.getFullYear() === now.getFullYear() &&
                  date.getMonth() === now.getMonth() &&
                  date.getDate() === now.getDate();

    if (isToday) {
      return time;
    }

    var yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    var isYesterday = date.getFullYear() === yesterday.getFullYear() &&
                      date.getMonth() === yesterday.getMonth() &&
                      date.getDate() === yesterday.getDate();

    if (isYesterday) {
      return '昨天 ' + time;
    }

    var month = date.getMonth() + 1;
    var day = date.getDate();
    return month + '/' + day + ' ' + time;
  },

  onInput: function (e) {
    this.setData({ inputValue: e.detail.value });
  },

  sendMessage: function () {
    var that = this;
    var content = this.data.inputValue.trim();
    if (!content) return;

    var conv = this.data.conversation;
    if (!conv) return;

    var receiverId = this.data.myUserId === conv.user_id ? conv.enterprise_id : conv.user_id;

    wx.request({
      url: BASE_URL + '/api/messages',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getToken()
      },
      data: {
        conversationId: that.data.conversationId,
        content: content,
        receiverId: receiverId
      },
      success: function (res) {
        if (res.statusCode === 200) {
          that.setData({ inputValue: '' });
          that.loadMessages();
        } else {
          wx.showToast({ title: '发送失败', icon: 'none' });
        }
      },
      fail: function () {
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  scrollToBottom: function () {
    var that = this;
    that.setData({ scrollTop: that.data.scrollTop });
    setTimeout(function () {
      that.setData({ scrollTop: 999999 });
    }, 150);
  },

});
