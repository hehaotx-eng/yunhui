/*
 * feed-engine.js — Feed 内容流引擎（产品化升级）
 *
 * 核心升级：
 *   ✅ 从「列表展示」→「内容流节奏」
 *   ✅ AI 推荐 → 隐式权重增强（不单独展示）
 *   ✅ 行为数据 → 影响下一次排序
 *   ✅ VIP 体验差异 → 权重/多样性提升
 *   ✅ 搜索结果 → 流内过滤感
 *
 * 排序因子：
 *   - freshness（新鲜度，24h内高权重）
 *   - salary（薪资权重）
 *   - behavior（用户行为匹配）
 *   - diversity（多样性推平）
 *   - vip_boost（VIP用户加权）
 */

const {
  FeedType, FeedSource,
  createFeedItem, createFeedResponse,
  createJobCard, createAICard, createCompanyPost
} = require('./contracts');

var userActionCache = {};
var userViewHistory = {};

function _recordView(userId, jobId) {
  if (!userId || !jobId) return;
  if (!userViewHistory[userId]) userViewHistory[userId] = [];
  userViewHistory[userId].push({ jobId: jobId, time: Date.now() });
  if (userViewHistory[userId].length > 100) userViewHistory[userId].shift();
}

function _getViewedJobs(userId) {
  var list = userViewHistory[userId] || [];
  var ids = {};
  for (var i = 0; i < list.length; i++) { ids[list[i].jobId] = true; }
  return ids;
}

// ==================== Feed 增强核心 ====================

function enhanceFeed(items, options) {
  if (!items || items.length === 0) return [];
  var userData = options && options.userData;
  var userId = userData && userData.id;
  var tier = (options && options.tier) || 'FREE';

  var viewed = userId ? _getViewedJobs(userId) : {};
  var scored = [];

  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var card = item.payload || {};
    var score = _calculateScore(card, tier, viewed[card.job_id || card.id]);
    item._feedScore = score;
    item._feedReason = _generateReason(score, card);
    scored.push(item);
  }

  var sorted = _sortWithDiversity(scored);
  return sorted;
}

function _calculateScore(card, tier, isViewed) {
  var base = 50;
  var isVIP = tier === 'VIP' || tier === 'SVIP';
  var isSVIP = tier === 'SVIP';

  // 新鲜度加分（24h内 +20，72h内 +10）
  var age = _getAgeHours(card.created_at);
  if (age < 24) base += 20;
  else if (age < 72) base += 10;

  // 薪资加分
  var salaryMax = parseInt(card.salary_max) || 0;
  if (salaryMax >= 30000) base += isVIP ? 15 : 10;
  else if (salaryMax >= 15000) base += isVIP ? 10 : 5;

  // 已看过减权
  if (isViewed) base -= 30;

  // VIP/SVIP 加权
  if (isVIP && card.is_vip_job) base += 15;
  if (isSVIP && card.is_priority_job) base += 20;

  // 标签丰富度
  var tags = card.tags || [];
  if (tags.length >= 3) base += 5;

  // 技能匹配（如果有用户画像）
  // 预留：card._skillMatch

  return base > 100 ? 100 : (base < 0 ? 0 : base);
}

function _sortWithDiversity(items) {
  if (!items || items.length === 0) return [];

  var sorted = items.slice().sort(function (a, b) {
    return (b._feedScore || 0) - (a._feedScore || 0);
  });

  // 多样性推平：前3保留高分段，后面混排不同段
  var top = sorted.slice(0, 3);
  var rest = sorted.slice(3);

  var buckets = { high: [], mid: [], low: [] };
  for (var i = 0; i < rest.length; i++) {
    var s = rest[i]._feedScore || 0;
    if (s >= 70) buckets.high.push(rest[i]);
    else if (s >= 40) buckets.mid.push(rest[i]);
    else buckets.low.push(rest[i]);
  }

  var diverse = top.slice();
  var hiIdx = 0, miIdx = 0, loIdx = 0;
  while (hiIdx < buckets.high.length || miIdx < buckets.mid.length || loIdx < buckets.low.length) {
    if (miIdx < buckets.mid.length) diverse.push(buckets.mid[miIdx++]);
    if (hiIdx < buckets.high.length) diverse.push(buckets.high[hiIdx++]);
    if (loIdx < buckets.low.length) diverse.push(buckets.low[loIdx++]);
  }

  return diverse;
}

function _injectRhythm(items, tier) {
  if (!items || items.length === 0) return [];

  var rhythmItems = [];
  var isVIP = tier === 'VIP' || tier === 'SVIP';
  var sectionSize = isVIP ? 6 : 4;

  for (var i = 0; i < items.length; i++) {
    rhythmItems.push(items[i]);
    // 每 sectionSize 个 job 后标记一个节奏点（VIP 更长节奏）
    if ((i + 1) % sectionSize === 0 && (i + 1) < items.length) {
      rhythmItems.push(_createRhythmMarker(items[i], i + 1, tier));
    }
  }

  return rhythmItems;
}

function _createRhythmMarker(prevItem, index, tier) {
  return createFeedItem({
    id: 'rhythm_' + index,
    type: FeedType.COMPANY_POST,
    title: _getRhythmTitle(index, tier),
    description: '',
    source: FeedSource.SYSTEM,
    weight: 60,
    payload: { is_rhythm: true, tier: tier }
  });
}

function _getRhythmTitle(index, tier) {
  var titles = [
    '💼 为你推荐以下优质岗位',
    '🔥 热门招聘中',
    '✨ 高薪机会精选',
    '📌 你可能感兴趣的'
  ];
  return titles[index % titles.length];
}

function _getAgeHours(dateStr) {
  if (!dateStr) return 999;
  var diff = Date.now() - new Date(dateStr).getTime();
  return diff / (1000 * 60 * 60);
}

function _generateReason(score, card) {
  if (score >= 80) return '🔥 高匹配';
  if (score >= 60) return '👍 推荐';
  return '';
}

// ==================== 对外接口 ====================

function jobToFeedItem(job) {
  var card = createJobCard(job);
  var item = createFeedItem({
    id: card.job_id,
    type: FeedType.JOB,
    title: card.title,
    subtitle: (card.salary || '面议') + ' · ' + (card.location || '地点不限'),
    description: card.description,
    cover: card.cover,
    tags: card.tags,
    source: FeedSource.COMPANY,
    created_at: card.created_at,
    weight: calculateJobWeight(card),
    payload: card
  });
  return applyTheme(normalizeSpacing(item));
}

function aiToFeedItem(recommend) {
  var card = createAICard(recommend);
  var item = createFeedItem({
    id: card.recommend_id,
    type: FeedType.AI_RECOMMEND,
    title: card.title,
    subtitle: (card.salary || '面议') + ' · 匹配度 ' + card.match_score + '%',
    description: card.reason,
    cover: '',
    tags: card.match_tags,
    source: FeedSource.AI,
    created_at: card.created_at,
    weight: calculateAIWeight(card),
    payload: card
  });
  return applyTheme(normalizeSpacing(item));
}

function postToFeedItem(post) {
  var card = createCompanyPost(post);
  var item = createFeedItem({
    id: card.post_id,
    type: FeedType.COMPANY_POST,
    title: (card.content || '').slice(0, 50),
    subtitle: card.company_name,
    description: card.content,
    cover: (card.images || [])[0] || '',
    tags: [],
    source: FeedSource.COMPANY,
    created_at: card.created_at,
    weight: calculatePostWeight(card),
    payload: card
  });
  return applyTheme(normalizeSpacing(item));
}

function normalizeFeedItem(raw) {
  if (!raw || !raw.type) return null;
  switch (raw.type) {
    case FeedType.JOB: return jobToFeedItem(raw);
    case FeedType.AI_RECOMMEND: return aiToFeedItem(raw);
    case FeedType.COMPANY_POST: return postToFeedItem(raw);
    default: return applyTheme(normalizeSpacing(createFeedItem(raw)));
  }
}

function normalizeFeedResponse(response) {
  if (!response) return createFeedResponse();
  var rawList = response.list || response.rows || response.data || response || [];
  var list = (Array.isArray(rawList) ? rawList : []).map(normalizeFeedItem).filter(Boolean);
  return createFeedResponse({
    list: list,
    has_more: response.has_more || list.length >= (response.page_size || 10),
    page: response.page || 1,
    page_size: response.page_size || 10,
    total: response.total || list.length
  });
}

function mergeFeed(jobs, aiItems, posts) {
  var merged = [];
  var aiIdx = 0, jobIdx = 0, postIdx = 0;
  var aiInterval = 5, postInterval = 8;

  while (jobIdx < jobs.length || aiIdx < aiItems.length || postIdx < posts.length) {
    var count = merged.length;
    if (aiIdx < aiItems.length && count > 0 && count % aiInterval === 0) {
      merged.push(aiItems[aiIdx++]);
    } else if (postIdx < posts.length && count > 0 && count % postInterval === 0) {
      merged.push(posts[postIdx++]);
    } else if (jobIdx < jobs.length) {
      merged.push(jobs[jobIdx++]);
    } else if (aiIdx < aiItems.length) {
      merged.push(aiItems[aiIdx++]);
    } else if (postIdx < posts.length) {
      merged.push(posts[postIdx++]);
    } else { break; }
  }

  return merged.sort(function (a, b) { return (b.weight || 0) - (a.weight || 0); });
}

function calculateJobWeight(job) {
  var w = 50;
  if (job.status === 'online') w += 10;
  if (job.is_favorite) w += 5;
  if (parseInt(job.salary_max) >= 30000) w += 10;
  if ((job.tags || []).length > 2) w += 5;
  return w;
}

function calculateAIWeight(card) {
  var w = 100;
  w += card.match_score || 0;
  if (card.confidence_level === 'high') w += 20;
  if (card.is_favorite) w += 5;
  return w;
}

function calculatePostWeight(post) {
  var w = 40;
  w += Math.min((post.like_count || 0) * 2, 20);
  w += Math.min((post.comment_count || 0) * 3, 15);
  if ((post.images || []).length > 0) w += 10;
  return w;
}

function applyTheme(item) {
  if (!item || !item.type) return item;
  var style = resolveCardStyle(item.type);
  return Object.assign({}, item, {
    _theme: { className: 'card--' + item.type.replace(/_/g, '-'), style: 'border-radius:' + style.radius + ';box-shadow:' + style.shadow + ';' }
  });
}

function normalizeSpacing(item) {
  if (!item) return item;
  return Object.assign({}, item, { _spacing: { padding: '24rpx', marginBottom: '20rpx' } });
}

var CARD_STYLES = {};
CARD_STYLES[FeedType.JOB] = { radius: '24rpx', shadow: '0 2rpx 12rpx rgba(15,23,42,.04)', padding: '24rpx', accent: '--c-accent' };
CARD_STYLES[FeedType.AI_RECOMMEND] = { radius: '24rpx', shadow: '0 2rpx 12rpx rgba(15,23,42,.04)', padding: '24rpx', accent: '--c-ai' };
CARD_STYLES[FeedType.COMPANY_POST] = { radius: '24rpx', shadow: '0 2rpx 12rpx rgba(15,23,42,.04)', padding: '24rpx', accent: '--c-text-2' };

function resolveCardStyle(type) { return CARD_STYLES[type] || CARD_STYLES[FeedType.JOB]; }

module.exports = {
  enhanceFeed: enhanceFeed,
  _recordView: _recordView,
  resolveCardStyle: resolveCardStyle,
  applyTheme: applyTheme,
  normalizeSpacing: normalizeSpacing,
  jobToFeedItem: jobToFeedItem,
  aiToFeedItem: aiToFeedItem,
  postToFeedItem: postToFeedItem,
  normalizeFeedItem: normalizeFeedItem,
  normalizeFeedResponse: normalizeFeedResponse,
  mergeFeed: mergeFeed,
  calculateJobWeight: calculateJobWeight,
  calculateAIWeight: calculateAIWeight,
  calculatePostWeight: calculatePostWeight
};
