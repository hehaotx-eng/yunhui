const { BASE_URL } = require('../../config/base');
const IMG_HOST = BASE_URL;

function resolveImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('/uploads/') || url.startsWith('/images/')) return `${IMG_HOST}${url}`;
  return url;
}

const FeedType = {
  JOB: 'job',
  COMPANY_POST: 'company_post',
  AI_RECOMMEND: 'ai_recommend',
  AD: 'ad',
  ACTIVITY: 'activity'
};

const FeedSource = {
  COMPANY: 'company',
  SYSTEM: 'system',
  AI: 'ai'
};

const JOB_TYPE_MAP = {
  fulltime: '全职',
  parttime: '兼职',
  intern: '实习',
  normal: '全职',
  premium: '高端'
};

function formatJobType(type) {
  return JOB_TYPE_MAP[type] || type || '';
}

const ConfidenceLevel = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

const JobStatus = {
  DRAFT: 'draft',
  ONLINE: 'online',
  OFFLINE: 'offline'
};

const AuditStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

const ApplicationStatus = {
  PENDING: 'pending',
  REVIEWING: 'reviewing',
  INTERVIEW: 'interview',
  OFFER: 'offer',
  REJECTED: 'rejected'
};

const VerifiedLevel = {
  NONE: 0,
  BASIC: 1,
  CERTIFIED: 2,
  PREMIUM: 3
};

function createJobCard(data = {}) {
  return {
    job_id: data.job_id || data.id || '',
    company_id: data.company_id || data.enterprise_id || '',
    company_name: data.company_name || data.enterprise_name || '',
    company_logo: resolveImageUrl(data.company_logo || data.enterprise_logo || data.enterprise_avatar),
    title: data.title || '',
    salary_min: data.salary_min || 0,
    salary_max: data.salary_max || 0,
    salary: data.salary || '',
    location: data.location || '',
    experience: data.experience || '',
    education: data.education || '',
    description: data.description || '',
    requirements: data.requirements || '',
    tags: data.tags || [],
    cover: resolveImageUrl(data.cover),
    status: data.status || JobStatus.ONLINE,
    ai_match_score: data.ai_match_score || null,
    ai_reason: data.ai_reason || null,
    is_favorite: data.is_favorite || false,
    favorite_count: data.favorite_count || 0,
    comment_count: data.comment_count || 0,
    created_at: data.created_at || '',
    updated_at: data.updated_at || '',
    job_type: data.job_type || '',
    vip_required: data.vip_required || false
  };
}

function createCompanyCard(data = {}) {
  return {
    company_id: data.company_id || data.id || '',
    name: data.name || '',
    logo: resolveImageUrl(data.logo),
    cover: resolveImageUrl(data.cover),
    industry: data.industry || '',
    size: data.size || data.scale || '',
    description: data.description || '',
    tags: data.tags || [],
    hiring_count: data.hiring_count || data.job_count || 0,
    follower_count: data.follower_count || 0,
    verified_level: data.verified_level || VerifiedLevel.NONE,
    latest_jobs: data.latest_jobs || [],
    latest_posts: data.latest_posts || [],
    created_at: data.created_at || ''
  };
}

function createAICard(data = {}) {
  var salary = data.salary || '';
  if (!salary && data.salary_min && data.salary_max) {
    salary = data.salary_min + '-' + data.salary_max + '元/月';
  } else if (!salary && data.salary_min) {
    salary = data.salary_min + '元/月起';
  }

  // match_score 后端返回的是百分比(0-100)或小数(0-1)
  var rawScore = data.match_score || data.combined_score || data.score || 0;
  var matchScore = rawScore <= 1 ? Math.round(rawScore * 100) : Math.round(rawScore);

  // 技能匹配标签
  var matchTags = data.match_tags || data.skill_tags || [];
  if (matchTags.length === 0 && data.skill_match && Array.isArray(data.skill_match)) {
    matchTags = data.skill_match;
  }

  return {
    recommend_id: data.recommend_id || data.id || '',
    job_id: data.job_id || '',
    company_id: data.company_id || data.enterprise_id || '',
    company_name: data.company_name || data.enterprise_name || '',
    company_logo: resolveImageUrl(data.company_logo || data.enterprise_logo || data.enterprise_avatar),
    title: data.title || data.job_title || '',
    salary: salary,
    salary_min: data.salary_min || 0,
    salary_max: data.salary_max || 0,
    location: data.location || '',
    experience: data.experience || '',
    match_score: matchScore,
    ai_score: data.ai_score || 0,
    keyword_score: data.keyword_score || 0,
    match_dimensions: data.match_dimensions || {
      skills: { value: data.skill_match || 0, level: 'medium' },
      experience: { value: data.experience_match || 0, level: 'medium' },
      location: { value: data.location_match || 0, level: 'medium' },
      salary: { value: data.salary_match || 0, level: 'medium' }
    },
    reason: data.reason || data.match_reason || data.recommend_reason || '',
    match_tags: matchTags,
    risk_note: data.risk_note || '',
    confidence_level: data.confidence_level || deriveConfidence(matchScore),
    vip_required: data.vip_required || false,
    is_favorite: data.is_favorite || false,
    created_at: data.created_at || ''
  };
}

function createCompanyPost(data = {}) {
  return {
    post_id: data.post_id || data.id || '',
    company_id: data.company_id || data.enterprise_id || '',
    company_name: data.company_name || data.enterprise_name || '',
    company_logo: resolveImageUrl(data.company_logo || data.enterprise_logo),
    content: data.content || '',
    images: (data.images || []).map(resolveImageUrl),
    job: data.job || null,
    like_count: data.like_count || 0,
    comment_count: data.comment_count || 0,
    share_count: data.share_count || 0,
    is_liked: data.is_liked || false,
    created_at: data.created_at || '',
    publish_time: data.publish_time || ''
  };
}

function createFeedItem(data = {}) {
  return {
    id: data.id || '',
    type: data.type || FeedType.JOB,
    title: data.title || '',
    subtitle: data.subtitle || '',
    description: data.description || '',
    cover: data.cover || '',
    tags: data.tags || [],
    source: data.source || FeedSource.COMPANY,
    created_at: data.created_at || '',
    weight: data.weight || 0,
    payload: data.payload || {}
  };
}

function createFeedResponse(data = {}) {
  return {
    list: data.list || [],
    has_more: data.has_more || false,
    page: data.page || 1,
    page_size: data.page_size || 10,
    total: data.total || 0
  };
}

function deriveConfidence(score) {
  if (score >= 80) return ConfidenceLevel.HIGH;
  if (score >= 60) return ConfidenceLevel.MEDIUM;
  return ConfidenceLevel.LOW;
}

module.exports = {
  FeedType,
  FeedSource,
  ConfidenceLevel,
  JobStatus,
  AuditStatus,
  ApplicationStatus,
  VerifiedLevel,
  JOB_TYPE_MAP,
  formatJobType,
  createJobCard,
  createCompanyCard,
  createAICard,
  createCompanyPost,
  createFeedItem,
  createFeedResponse,
  deriveConfidence
};
