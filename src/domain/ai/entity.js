function FeatureVector(data) {
  this.userFeatures = data.userFeatures || {};
  this.jobFeatures = data.jobFeatures || {};
  this.contextFeatures = data.contextFeatures || {};
  this.timestamp = data.timestamp || Date.now();
}

function ScoreResult(data) {
  this.jobId = data.jobId || null;
  this.userId = data.userId || null;
  this.baseScore = data.baseScore || 0;
  this.aiScore = data.aiScore || 0;
  this.finalScore = data.finalScore || 0;
  this.reason = data.reason || '';
}

function RankedItem(data) {
  this.item = data.item || null;
  this.score = data.score || 0;
  this.rank = data.rank || 0;
  this.reason = data.reason || '';
}

module.exports = { FeatureVector: FeatureVector, ScoreResult: ScoreResult, RankedItem: RankedItem };
