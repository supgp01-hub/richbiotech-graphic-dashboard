(function () {
  'use strict';

  var PUBLIC_PATH = '/richbiotech-graphic-dashboard/';

  function normalizePublicUrl(input, origin) {
    var url = new URL(input, origin || window.location.origin);
    var version = url.searchParams.get('v') || '';

    if (!/^fix[\w.-]*$/i.test(version)) return url.pathname + url.search + url.hash;

    url.searchParams.delete('v');
    if (/^\d{10,}$/.test(url.searchParams.get('t') || '')) url.searchParams.delete('t');

    var path = /\/richbiotech-graphic-dashboard\/index\.html$/i.test(url.pathname)
      ? PUBLIC_PATH
      : url.pathname.replace(/\/index\.html$/i, '/');
    var query = url.searchParams.toString();
    return path + (query ? '?' + query : '') + url.hash;
  }

  function applyStablePublicUrl() {
    try {
      var current = window.location.pathname + window.location.search + window.location.hash;
      var normalized = normalizePublicUrl(window.location.href, window.location.origin);
      if (normalized !== current && window.history && window.history.replaceState) {
        window.history.replaceState(window.history.state, document.title, normalized);
      }
    } catch (error) {
      // URL normalization must never block the dashboard from loading.
    }
  }

  window._rbStablePublicUrlTest = { normalizePublicUrl: normalizePublicUrl };
  applyStablePublicUrl();
})();
