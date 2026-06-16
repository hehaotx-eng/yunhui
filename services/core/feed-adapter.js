const {
  FeedType, FeedSource,
  createFeedItem, createFeedResponse,
  createJobCard, createAICard, createCompanyPost
} = require('./contracts');

function jobToFeedItem(job) {
  const card = createJobCard(job);
  return createFeedItem({
    id: card.job_id,
    type: FeedType.JOB,
    title: card.title,
    subtitle: `${card.salary || '面议'} · ${card.location || '地点不限'}`,
    description: card.description,
    cover: card.cover,
    tags: card.tags,
    source: FeedSource.COMPANY,
    created_at: card.created_at,
    weight: calculateJobWeight(card),
    payload: card
  });
}

function aiToFeedItem(recommend) {
  const card = createAICard(recommend);
  return createFeedItem({
    id: card.recommend_id,
    type: FeedType.AI_RECOMMEND,
    title: card.title,
    subtitle: `${card.salary || '面议'} · 匹配度 ${card.match_score}%`,
    description: card.reason,
    cover: '',
    tags: card.match_tags,
    source: FeedSource.AI,
    created_at: card.created_at,
    weight: calculateAIWeight(card),
    payload: card
  });
}

function postToFeedItem(post) {
  const card = createCompanyPost(post);
  return createFeedItem({
    id: card.post_id,
    type: FeedType.COMPANY_POST,
    title: card.content.slice(0, 50),
    subtitle: card.company_name,
    description: card.content,
    cover: card.images[0] || '',
    tags: [],
    source: FeedSource.COMPANY,
    created_at: card.created_at,
    weight: calculatePostWeight(card),
    payload: card
  });
}

function normalizeFeedItem(raw) {
  if (!raw || !raw.type) return null;
  switch (raw.type) {
    case FeedType.JOB:
      return jobToFeedItem(raw);
    case FeedType.AI_RECOMMEND:
      return aiToFeedItem(raw);
    case FeedType.COMPANY_POST:
      return postToFeedItem(raw);
    default:
      return createFeedItem(raw);
  }
}

function normalizeFeedResponse(response) {
  if (!response) return createFeedResponse();
  const rawList = response.list || response.rows || response.data || response || [];
  const list = (Array.isArray(rawList) ? rawList : [])
    .map(normalizeFeedItem)
    .filter(Boolean);
  return createFeedResponse({
    list,
    has_more: response.has_more || list.length >= (response.page_size || 10),
    page: response.page || 1,
    page_size: response.page_size || 10,
    total: response.total || list.length
  });
}

function calculateJobWeight(job) {
  let w = 50;
  if (job.status === 'online') w += 10;
  if (job.is_favorite) w += 5;
  if (job.salary_max >= 30000) w += 10;
  if (job.tags.length > 2) w += 5;
  return w;
}

function calculateAIWeight(card) {
  let w = 100;
  w += card.match_score;
  if (card.confidence_level === 'high') w += 20;
  if (card.is_favorite) w += 5;
  return w;
}

function calculatePostWeight(post) {
  let w = 40;
  w += Math.min(post.like_count * 2, 20);
  w += Math.min(post.comment_count * 3, 15);
  if (post.images.length > 0) w += 10;
  return w;
}

module.exports = {
  jobToFeedItem,
  aiToFeedItem,
  postToFeedItem,
  normalizeFeedItem,
  normalizeFeedResponse
};
