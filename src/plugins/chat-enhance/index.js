var ChatService = require('../../domain/chat/service');

module.exports = {
  name: 'chat-enhance',
  version: '2.0.0',

  install: function(core) {
    var PRESET_PHRASES = [
      '你好，我对这个职位很感兴趣',
      '方便聊聊吗？',
      '请问还在招聘吗？',
      '我想了解一下岗位详情',
      '这是我的简历，请查收',
      '感谢您的回复'
    ];

    core.on('chat:beforeSend', function(ctx) {
      if (ctx && ctx.content) {
        ctx.timestamp = Date.now();
      }
    });

    core.services = core.services || {};
    core.services.chatEnhance = {
      getPresetPhrases: function() { return PRESET_PHRASES.slice(); },
      getCustomPhrases: function() {
        try { return wx.getStorageSync('customPhrases') || []; } catch(e) { return []; }
      },
      saveCustomPhrase: function(phrase) {
        var list = [];
        try { list = wx.getStorageSync('customPhrases') || []; } catch(e) {}
        list.push(phrase);
        wx.setStorageSync('customPhrases', list);
        return list;
      },
      removeCustomPhrase: function(index) {
        var list = [];
        try { list = wx.getStorageSync('customPhrases') || []; } catch(e) {}
        if (index >= 0 && index < list.length) list.splice(index, 1);
        wx.setStorageSync('customPhrases', list);
        return list;
      }
    };
  }
};
