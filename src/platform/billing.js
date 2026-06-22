var PlatformBilling = {
  _plans: {
    free: { name: '免费版', maxJobs: 3, maxCandidates: 50, aiEnabled: false },
    basic: { name: '基础版', maxJobs: 10, maxCandidates: 200, aiEnabled: true },
    pro: { name: '专业版', maxJobs: 50, maxCandidates: 1000, aiEnabled: true },
    enterprise: { name: '企业版', maxJobs: -1, maxCandidates: -1, aiEnabled: true }
  },

  getPlan: function(planName) {
    return this._plans[planName] || this._plans.free;
  },

  canPublishJob: function(planName, currentCount) {
    var plan = this.getPlan(planName);
    if (plan.maxJobs === -1) return true;
    return currentCount < plan.maxJobs;
  },

  canViewCandidate: function(planName, currentCount) {
    var plan = this.getPlan(planName);
    if (plan.maxCandidates === -1) return true;
    return currentCount < plan.maxCandidates;
  },

  isAIEnabled: function(planName) {
    var plan = this.getPlan(planName);
    return plan.aiEnabled;
  }
};

module.exports = PlatformBilling;
