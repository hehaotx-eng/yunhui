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
    var jobType = params.jobType || '';
    var userData = params.userData || null;
    var isSearch = !!keyword;
    var tier = _getTier(userData);
    var excludeVip = params.excludeVip === true;
    var location = params.location || '';
    var salaryRange = params.salaryRange || '';
    var benefits = params.benefits || '';

    // ===== L1: 数据源级 =====
    var jobFeed = EMPTY_FEED;
    var l1Failed = false;

    try {
      if (isSearch) {
        var searchParams = { keyword: keyword, page: params.page, limit: params.limit };
        if (excludeVip) searchParams.exclude_vip = true;
        if (location) searchParams.location = location;
        if (salaryRange) searchParams.salary_range = salaryRange;
        if (benefits) searchParams.benefits = benefits;
        var searchResult = await job.searchJobs(searchParams);
        jobFeed = searchResult || EMPTY_FEED;
      } else {
        var feedParams = { page: params.page, limit: params.limit, sort: 'created_at', order: 'desc' };
        if (jobType) feedParams.job_type = jobType;
        if (excludeVip) feedParams.exclude_vip = true;
        if (params.location) feedParams.location = params.location;
        if (params.salaryRange) feedParams.salary_range = params.salaryRange;
        if (params.benefits) feedParams.benefits = params.benefits;
        var feedResult = await job.getJobFeed(feedParams);
        jobFeed = feedResult || EMPTY_FEED;
      }
    } catch (e) {
      jobFeed = EMPTY_FEED;
      l1Failed = true;
    }

    var jobList = _ensureFeedItems(jobFeed.list || []);

    // ===== L2: 客户端VIP过滤 =====
    if (excludeVip && jobList.length > 0) {
      var filtered = [];
      for (var fi = 0; fi < jobList.length; fi++) {
        var fp = jobList[fi].payload || {};
        if (!fp.vip_required) filtered.push(jobList[fi]);
      }
      jobList = filtered;
    }

    // ===== L3: 兜底 — 仅当 L1 失败且无主动过滤条件时 =====
    var merged = jobList.slice();

    if (!merged || merged.length === 0) {
      if (l1Failed && !jobType) {
        try {
          var fallbackParams = { page: 1, limit: params.limit, sort: 'created_at', order: 'desc' };
          if (excludeVip) fallbackParams.exclude_vip = true;
          var basicFeed = await job.getJobFeed(fallbackParams);
          merged = _ensureFeedItems((basicFeed && basicFeed.list) || []);
        } catch (e) { merged = []; }
      }
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
