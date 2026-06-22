var AIService = require('../../domain/ai/service');

module.exports = {
  name: 'ai-recommend',
  version: '2.0.0',

  install: function(core) {
    var pipeline = require('../../ai/pipeline');

    core.on('feed:beforeRender', function(ctx) {
      if (!ctx || !ctx.jobs || !ctx.user) return;
      var scored = ctx.jobs.map(function(job) {
        var result = AIService.score(job, ctx.user);
        return { item: job, score: result.finalScore, reason: AIService.getRecommendReason(job, ctx.user) };
      });
      ctx.scoredJobs = scored.sort(function(a, b) { return b.score - a.score; });
    });

    core.services = core.services || {};
    core.services.aiRecommend = {
      score: function(job, user) { return AIService.score(job, user); },
      pipeline: pipeline
    };

    core.emit('plugin:ai-recommend:ready');
  },

  uninstall: function(core) {
    core.off('feed:beforeRender');
  }
};
