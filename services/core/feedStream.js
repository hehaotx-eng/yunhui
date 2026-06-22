/*
 * feedStream.js — 统一数据流入口（稳定性增强版）
 *
 * 三层兜底机制 + 数据归一化
 *   所有输出保证是 feed item 格式（含 type / payload）
 */

var feedEngine = require('./feed-engine');
var job = require('../job/service');
var ai = require('../ai/service');
var { BASE_URL } = require('../../config/base');
var auth = require('./auth');

function _getTier(userData) {
  if (!userData) return 'FREE';
  var userType = userData.user_type || '';
  if (userType === 'svip') return 'SVIP';
  if (userType === 'vip') return 'VIP';
  return 'FREE';
}

function _ensureFeedItems(list) {
  if (!list || list.length === 0) return [];
  var result = [];
  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    if (item && item.type && item.payload) {
      result.push(item);
    } else if (item && (item.id || item.job_id)) {
      result.push(feedEngine.jobToFeedItem(item));
    }
  }
  return result;
}

var EMPTY_FEED = { list: [], total: 0 };

var FeedStream = {
  get: async function (params) {
    params = params || {};
    params.page = params.page || 1;
    params.limit = params.limit || 10;

    var keyword = params.keyword || '';
    var categoryId = params.categoryId || '';
    var userData = params.userData || null;
    var isSearch = !!keyword;
    var tier = _getTier(userData);

    // ===== L1: 数据源级兜底 =====
    var jobFeed = EMPTY_FEED;
    var aiFeed = EMPTY_FEED;

    try {
      if (isSearch) {
        var searchResult = await job.searchJobs({ keyword: keyword, page: params.page, limit: params.limit });
        jobFeed = searchResult || EMPTY_FEED;
      } else {
        var feedParams = { page: params.page, limit: params.limit };
        if (categoryId) feedParams.category_id = categoryId;
        var feedResult = await job.getJobFeed(feedParams);
        jobFeed = feedResult || EMPTY_FEED;
      }
    } catch (e) {
      jobFeed = EMPTY_FEED;
    }

    var jobList = _ensureFeedItems(jobFeed.list || []);

    // ===== L2: 合并级兜底 =====
    var merged = jobList.slice();

    if (!merged || merged.length === 0) {
      merged = jobList.slice();
    }

    // ===== L3: 硬兜底 =====
    if (!merged || merged.length === 0) {
      try {
        var basicFeed = await job.getJobFeed({ page: 1, limit: params.limit });
        merged = _ensureFeedItems((basicFeed && basicFeed.list) || []);
      } catch (e) { merged = []; }
    }

    // ===== L4: 终极兜底 — 直接请求 /api/v1/jobs =====
    if (!merged || merged.length === 0) {
      try {
        var raw = await new Promise(function (resolve, reject) {
          wx.request({
            url: BASE_URL + '/api/v1/jobs?page=1&limit=' + (params.limit || 10),
            method: 'GET',
            header: { 'Content-Type': 'application/json' },
            success: function (res) {
              var body = res.data || {};
              if (res.statusCode >= 200 && res.statusCode < 300 && (body.code === 0 || body.code === 200)) {
                resolve(body.data || { list: [] });
              } else { reject(new Error('fail')); }
            },
            fail: function () { reject(new Error('network fail')); }
          });
        });
        var rawList = raw.list || raw.rows || raw || [];
        if (Array.isArray(rawList)) {
          merged = _ensureFeedItems(rawList);
        }
      } catch (e) { merged = []; }
    }

    // ===== 增强排序 =====
    var enhanced = merged;
    try {
      enhanced = feedEngine.enhanceFeed(merged, {
        userData: userData,
        tier: tier,
        isSearch: isSearch
      });
    } catch (e) {
      enhanced = merged;
    }

    if (!enhanced || enhanced.length === 0) enhanced = merged;

    var VALID_TYPES = { job: true, ai_recommend: true, company_post: true };
    for (var k = 0; k < enhanced.length; k++) {
      if (!enhanced[k] || !enhanced[k].type || !VALID_TYPES[enhanced[k].type]) {
        enhanced.splice(k, 1);
        k--;
      }
    }

    return {
      list: enhanced,
      total: jobFeed.total || enhanced.length || 0,
      hasMore: jobFeed.hasMore || enhanced.length >= (params.limit || 10),
      page: params.page,
      aiCount: 0,
      tier: tier
    };
  },

  search: function (keyword, page, userData) {
    return this.get({ keyword: keyword, page: page || 1, userData: userData });
  },

  refresh: function (userData) {
    return this.get({ page: 1, userData: userData });
  }
};

module.exports = FeedStream;
