var FeedModel = {
  merge: function(feedList, aiList) {
    var merged = (feedList || []).slice();
    var existingIds = {};
    merged.forEach(function(item) { if (item.id) existingIds[item.id] = true; });
    (aiList || []).forEach(function(aiItem) {
      if (aiItem.id && !existingIds[aiItem.id]) {
        aiItem.source = 'ai';
        merged.push(aiItem);
        existingIds[aiItem.id] = true;
      }
    });
    return merged.sort(function(a, b) { return (b.score || 0) - (a.score || 0); });
  },

  deduplicate: function(list) {
    var seen = {};
    return (list || []).filter(function(item) {
      var key = item.id || JSON.stringify(item.payload);
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }
};

module.exports = FeedModel;
