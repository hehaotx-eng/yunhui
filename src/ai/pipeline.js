var FeatureExtractor = require('./featureExtractor');
var ScoringEngine = require('./scoringEngine');
var Ranker = require('./ranker');

var Pipeline = function() {
  this._stages = [
    { name: 'extract', fn: FeatureExtractor.extract },
    { name: 'score', fn: function(features) { return ScoringEngine.score(features); } },
    { name: 'rank', fn: function(scored) { return Ranker.rank(scored); } }
  ];
  this._hooks = { beforeEach: [], afterEach: [] };
};

Pipeline.prototype.use = function(stage) {
  if (stage && stage.name && stage.fn) {
    this._stages.push(stage);
  }
  return this;
};

Pipeline.prototype.beforeEach = function(fn) {
  this._hooks.beforeEach.push(fn);
  return this;
};

Pipeline.prototype.afterEach = function(fn) {
  this._hooks.afterEach.push(fn);
  return this;
};

Pipeline.prototype.run = function(jobs, user) {
  var context = { jobs: jobs, user: user, results: [] };
  for (var i = 0; i < this._hooks.beforeEach.length; i++) {
    this._hooks.beforeEach[i](context);
  }

  var features = this._stages[0].fn(jobs, user);
  var scored = this._stages[1].fn(features);

  if (Array.isArray(jobs)) {
    var scoredList = jobs.map(function(job) {
      var f = this._stages[0].fn(job, user);
      var s = this._stages[1].fn(f);
      return { item: job, score: s.totalScore, details: s.details };
    }.bind(this));
    context.results = this._stages[2].fn(scoredList);
  } else {
    context.results = [{ item: jobs, score: scored.totalScore, details: scored.details }];
  }

  for (var j = 0; j < this._hooks.afterEach.length; j++) {
    this._hooks.afterEach[j](context);
  }

  return context.results;
};

Pipeline.prototype.runSingle = function(job, user) {
  return this.run([job], user);
};

var defaultPipeline = new Pipeline();

module.exports = defaultPipeline;
module.exports.Pipeline = Pipeline;
