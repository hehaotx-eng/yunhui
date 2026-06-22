var RecallEngine = require('./recall');
var FilterEngine = require('./filter');
var Ranker = require('../ai/ranker');
var pipeline = require('../ai/pipeline');

var FeedEngine = {
  build: function(jobs, options) {
    var ctx = { jobs: jobs || [], options: options || {} };
    var list = ctx.jobs;

    if (ctx.options.keyword) list = RecallEngine.byKeyword(list, ctx.options.keyword);
    if (ctx.options.city) list = RecallEngine.byCity(list, ctx.options.city);
    if (ctx.options.category) list = RecallEngine.byCategory(list, ctx.options.category);
    if (ctx.options.salary) list = FilterEngine.bySalary(list, ctx.options.salary);
    if (ctx.options.experience) list = FilterEngine.byExperience(list, ctx.options.experience);
    if (ctx.options.education) list = FilterEngine.byEducation(list, ctx.options.education);

    if (ctx.options.ai && ctx.options.user) {
      var ranked = pipeline.run(list, ctx.options.user);
      list = ranked.map(function(r) { return r.item; });
    }

    var result = FilterEngine.paginate(list, ctx.options.page, ctx.options.pageSize || 10);
    return {
      list: result.list,
      total: result.total,
      page: ctx.options.page || 1,
      pageSize: ctx.options.pageSize || 10,
      hasMore: result.total > ((ctx.options.page || 1) * (ctx.options.pageSize || 10))
    };
  },

  recall: RecallEngine,
  filter: FilterEngine,
  rank: Ranker
};

module.exports = FeedEngine;
