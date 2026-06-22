function formatTime(t) {
  if (!t) return '';
  var d = new Date(t);
  var Y = d.getFullYear();
  var M = d.getMonth() + 1;
  var D = d.getDate();
  var h = d.getHours();
  var m = d.getMinutes();
  if (M < 10) M = '0' + M;
  if (D < 10) D = '0' + D;
  if (h < 10) h = '0' + h;
  if (m < 10) m = '0' + m;
  return Y + '-' + M + '-' + D + ' ' + h + ':' + m;
}

function throttle(fn, delay) {
  var timer = null;
  return function() {
    var args = arguments;
    var ctx = this;
    if (timer) return;
    timer = setTimeout(function() {
      fn.apply(ctx, args);
      timer = null;
    }, delay);
  };
}

function debounce(fn, delay) {
  var timer = null;
  return function() {
    var args = arguments;
    var ctx = this;
    if (timer) clearTimeout(timer);
    timer = setTimeout(function() {
      fn.apply(ctx, args);
    }, delay);
  };
}

module.exports = {
  formatTime: formatTime,
  throttle: throttle,
  debounce: debounce
};
