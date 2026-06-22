var Ranker = {
  rank: function(scoredList) {
    if (!scoredList || scoredList.length === 0) return [];
    var sorted = scoredList.slice().sort(function(a, b) {
      var sa = a.score || a.totalScore || 0;
      var sb = b.score || b.totalScore || 0;
      if (sa !== sb) return sb - sa;
      return (a.id || 0) - (b.id || 0);
    });
    return sorted.map(function(item, index) {
      return {
        item: item.item || item,
        score: item.score || item.totalScore || 0,
        rank: index + 1,
        reason: item.reason || ''
      };
    });
  },

  rerank: function(rankedList, boostRules) {
    if (!boostRules) return rankedList;
    return rankedList.map(function(item) {
      var boosted = item.score;
      for (var i = 0; i < boostRules.length; i++) {
        var rule = boostRules[i];
        if (rule.condition && rule.condition(item)) {
          boosted += rule.boost || 0;
        }
      }
      item.score = Math.min(boosted, 100);
      return item;
    }).sort(function(a, b) { return b.score - a.score; });
  }
};

module.exports = Ranker;
