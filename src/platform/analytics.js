var PlatformAnalytics = {
  _events: [],

  track: function(event, data) {
    var entry = {
      event: event,
      data: data || {},
      timestamp: Date.now()
    };
    this._events.push(entry);
    if (this._events.length > 200) this._events.shift();
    try {
      var report = wx.getStorageSync('analytics') || [];
      report.push(entry);
      if (report.length > 100) report.splice(0, report.length - 100);
      wx.setStorageSync('analytics', report);
    } catch (e) {}
    return entry;
  },

  trackPageView: function(pageName) {
    return this.track('page_view', { page: pageName });
  },

  trackAction: function(action, label) {
    return this.track('action', { action: action, label: label });
  },

  getEvents: function() {
    return this._events.slice();
  },

  clear: function() {
    this._events = [];
    try { wx.removeStorageSync('analytics'); } catch (e) {}
  }
};

module.exports = PlatformAnalytics;
