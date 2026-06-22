var ChatModel = {
  shouldShowTimeSeparator: function(currentMsg, prevMsg) {
    if (!prevMsg || !prevMsg.createdAt) return true;
    if (!currentMsg || !currentMsg.createdAt) return false;
    var diff = new Date(currentMsg.createdAt) - new Date(prevMsg.createdAt);
    return diff > 180000;
  },

  generateJobPreview: function(jobData) {
    if (!jobData) return '💼 岗位信息';
    var preview = '💼 ' + (jobData.title || '岗位');
    if (jobData.company) preview += ' · ' + jobData.company;
    return preview;
  }
};

module.exports = ChatModel;
