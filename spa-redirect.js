// GitHub Pages cannot rewrite client-side routes, so a deep link like
// /Finance-Analyzer/transactions gets a 404 page, not the SPA. Two
// entry points load this file:
//
//   1. index.html (no query) — restores the real path from ?p= if set;
//   2. 404.html (?type=404) — bounces the requested path into ?p=.
(function () {
  var base = '/Finance-Analyzer'
  var is404 = document.currentScript && document.currentScript.src.indexOf('type=404') !== -1

  if (is404) {
    var requested = location.pathname
    if (requested.indexOf(base) === 0) {
      requested = requested.slice(base.length)
    }
    location.replace(base + '/?p=' + encodeURIComponent(requested || '/'))
    return
  }

  var params = new URLSearchParams(location.search)
  var target = params.get('p')
  if (target) {
    history.replaceState(null, '', base + target)
  }
})()