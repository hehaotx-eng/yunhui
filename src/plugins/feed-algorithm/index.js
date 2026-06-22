var FeedService = require('../../domain/feed/service');

module.exports = {
  name: 'feed-algorithm',
  version: '2.0.0',

  install: function(core) {
    core.on('feed:build', function(ctx) {
      if (!ctx || !ctx.list) return;
      ctx.list = FeedService.deduplicate(ctx.list);
      if (ctx.aiList) {
        ctx.list = FeedService.mergeWithAI(ctx.list, ctx.aiList);
      }
    });

    core.services = core.services || {};
    core.services.feedAlgorithm = {
      merge: function(feed, ai) { return FeedService.mergeWithAI(feed, ai); },
      dedup: function(list) { return FeedService.deduplicate(list); }
    };

    core.emit('plugin:feed-algorithm:ready');
  },

  uninstall: function(core) {
    core.off('feed:build');
  }
};
