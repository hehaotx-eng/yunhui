var ScoringEngine = {
  score: function(features) {
    var uf = features.userFeatures || {};
    var jf = features.jobFeatures || {};
    var score = 0;
    var details = [];

    if (uf.expectedJob && jf.title && uf.expectedJob.indexOf(jf.title) !== -1) {
      score += 25;
      details.push({ factor: 'titleMatch', weight: 25, score: 25 });
    }

    if (uf.skills && jf.tags) {
      var matchCount = 0;
      for (var i = 0; i < uf.skills.length; i++) {
        for (var j = 0; j < jf.tags.length; j++) {
          if (uf.skills[i] === jf.tags[j]) matchCount++;
        }
      }
      var skillScore = Math.min(matchCount * 10, 30);
      score += skillScore;
      details.push({ factor: 'skillMatch', weight: 30, score: skillScore });
    }

    if (uf.expectedCity && jf.location && uf.expectedCity === jf.location) {
      score += 15;
      details.push({ factor: 'cityMatch', weight: 15, score: 15 });
    }

    if (uf.education && jf.education) {
      var order = { '博士': 4, '硕士': 3, '本科': 2, '大专': 1 };
      var ue = order[uf.education] || 0;
      var je = order[jf.education] || 0;
      if (ue >= je) {
        score += 10;
        details.push({ factor: 'educationMatch', weight: 10, score: 10 });
      }
    }

    if (uf.experience && jf.experience) {
      score += 10;
      details.push({ factor: 'experienceMatch', weight: 10, score: 10 });
    }

    return {
      totalScore: Math.min(score, 100),
      details: details,
      breakdown: details.map(function(d) { return d.factor + ':' + d.score; }).join(', ')
    };
  }
};

module.exports = ScoringEngine;
