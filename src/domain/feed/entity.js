function FeedItem(data) {
  this.type = data.type || 'job';
  this.source = data.source || 'user';
  this.score = data.score || 0;
  this.payload = data.payload || {};
  this.id = data.id || (data.payload && data.payload.id) || null;
}

FeedItem.prototype.isValid = function() { return !!this.id; };
FeedItem.prototype.isAIRecommended = function() { return this.source === 'ai'; };

function createFeedItem(type, payload, score, source) {
  return new FeedItem({ type: type || 'job', payload: payload || {}, score: score || 0, source: source || 'user' });
}

module.exports = { FeedItem: FeedItem, createFeedItem: createFeedItem };
