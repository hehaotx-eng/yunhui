var RecallEngine = {
  byKeyword: function(jobs, keyword) {
    if (!keyword) return jobs || [];
    var kw = keyword.toLowerCase();
    return (jobs || []).filter(function(job) {
      return (job.title || '').toLowerCase().indexOf(kw) !== -1 ||
             (job.company_name || '').toLowerCase().indexOf(kw) !== -1 ||
             (job.location || '').toLowerCase().indexOf(kw) !== -1;
    });
  },

  byCategory: function(jobs, categoryId) {
    if (!categoryId) return jobs || [];
    return (jobs || []).filter(function(j) { return String(j.category_id) === String(categoryId); });
  },

  byCity: function(jobs, city) {
    if (!city) return jobs || [];
    return (jobs || []).filter(function(j) { return j.location === city; });
  },

  byEnterprise: function(jobs, enterpriseId) {
    if (!enterpriseId) return jobs || [];
    return (jobs || []).filter(function(j) {
      return String(j.enterprise_id) === String(enterpriseId) || String(j.company_id) === String(enterpriseId);
    });
  },

  combine: function() {
    var args = Array.prototype.slice.call(arguments);
    var seen = {};
    var result = [];
    for (var i = 0; i < args.length; i++) {
      var list = args[i] || [];
      for (var j = 0; j < list.length; j++) {
        var item = list[j];
        var key = item.id || JSON.stringify(item);
        if (!seen[key]) {
          seen[key] = true;
          result.push(item);
        }
      }
    }
    return result;
  }
};

module.exports = RecallEngine;
