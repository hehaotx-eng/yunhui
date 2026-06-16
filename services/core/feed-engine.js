const {
  FeedType, FeedSource,
  createFeedItem, createFeedResponse,
  createJobCard, createAICard, createCompanyPost
} = require('./contracts');

const CARD_STYLES = {
  [FeedType.JOB]: {
    radius: '24rpx',
    shadow: '0 2rpx 12rpx rgba(15,23,42,.04)',
    padding: '24rpx',
    accent: '--c-accent'
  },
  [FeedType.AI_RECOMMEND]: {
    radius: '24rpx',
    shadow: '0 2rpx 12rpx rgba(15,23,42,.04)',
    padding: '24rpx',
    accent: '--c-ai'
  },
  [FeedType.COMPANY_POST]: {
    radius: '24rpx',
    shadow: '0 2rpx 12rpx rgba(15,23,42,.04)',
    padding: '24rpx',
    accent: '--c-text-2'
  }
};

function resolveCardStyle(type) {
  return CARD_STYLES[type] || CARD_STYLES[FeedType.JOB];
}

function applyTheme(item) {
  if (!item || !item.type) return item;
  const style = resolveCardStyle(item.type);
  return {
    ...item,
    _theme: {
      className: `card--${item.type.replace('_', '-')}`,
      style: `border-radius:${style.radius};box-shadow:${style.shadow};`
    }
  };
}

function normalizeSpacing(item) {
  if (!item) return item;
  return {
    ...item,
    _spacing: {
      padding: '24rpx',
      marginBottom: '20rpx'
    }
  };
}

function jobToFeedItem(job) {
  const card = createJobCard(job);
  const item = createFeedItem({
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
  return applyTheme(normalizeSpacing(item));
}

function aiToFeedItem(recommend) {
  const card = createAICard(recommend);
  const item = createFeedItem({
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
  return applyTheme(normalizeSpacing(item));
}

function postToFeedItem(post) {
  const card = createCompanyPost(post);
  const item = createFeedItem({
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
  return applyTheme(normalizeSpacing(item));
}

function normalizeFeedItem(raw) {
  if (!raw || !raw.type) return null;
  switch (raw.type) {
    case FeedType.JOB:           return jobToFeedItem(raw);
    case FeedType.AI_RECOMMEND:  return aiToFeedItem(raw);
    case FeedType.COMPANY_POST:  return postToFeedItem(raw);
    default:                     return applyTheme(normalizeSpacing(createFeedItem(raw)));
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

function mergeFeed(jobs, aiItems, posts) {
  const merged = [];
  let aiIdx = 0;
  let jobIdx = 0;
  let postIdx = 0;
  const aiInterval = 5;
  const postInterval = 8;

  while (jobIdx < jobs.length || aiIdx < aiItems.length || postIdx < posts.length) {
    const count = merged.length;

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
    } else {
      break;
    }
  }

  return merged.sort((a, b) => (b.weight || 0) - (a.weight || 0));
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
  resolveCardStyle,
  applyTheme,
  normalizeSpacing,
  jobToFeedItem,
  aiToFeedItem,
  postToFeedItem,
  normalizeFeedItem,
  normalizeFeedResponse,
  mergeFeed
};
