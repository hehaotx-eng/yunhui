var entity = require('./entity');
var model = require('./model');

var FeedService = {
  createFeed: function(list) {
    return (list || []).map(function(item) { return entity.createFeedItem(item.type, item.payload, item.score, item.source); });
  },

  mergeWithAI: function(feedList, aiList) {
    return model.merge(feedList, aiList);
  },

  deduplicate: function(list) {
    return model.deduplicate(list);
  }
};

module.exports = FeedService;
