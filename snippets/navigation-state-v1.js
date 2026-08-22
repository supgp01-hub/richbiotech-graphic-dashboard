(function () {
  'use strict';

  var SESSION_KEY = 'rb_view_state_v1';
  var GRAPHIC_SUB_KEY = 'rb_graphic_sub_v1';
  var DEFAULT_MAIN = 'overview';
  var DEFAULT_SUB = 'team';
  var GRAPHIC_SUBS = ['team', 'order', 'links', 'commission', 'audit', 'fblist', 'listfb', 'idcard'];

  function storageGet(storage, key) {
    try { return storage && storage.getItem(key); } catch (e) { return null; }
  }

  function storageSet(storage, key, value) {
    try { if (storage) storage.setItem(key, value); } catch (e) {}
  }

  function mainExists(name) {
    return !!(name && document.getElementById('tab-' + name));
  }

  function normalise(state) {
    state = state && typeof state === 'object' ? state : {};
    var main = mainExists(state.main) ? state.main : DEFAULT_MAIN;
    if (!mainExists(main)) {
      var first = document.querySelector('.tab-panel[id^="tab-"]');
      main = first ? first.id.replace(/^tab-/, '') : DEFAULT_MAIN;
    }
    var sub = GRAPHIC_SUBS.indexOf(state.sub) >= 0 ? state.sub : DEFAULT_SUB;
    return { main: main, sub: sub };
  }

  function readState() {
    var sessionState = null;
    try { sessionState = JSON.parse(storageGet(window.sessionStorage, SESSION_KEY) || 'null'); } catch (e) {}
    if (sessionState && mainExists(sessionState.main)) return normalise(sessionState);
    return normalise({
      main: storageGet(window.localStorage, 'rb_tab') || DEFAULT_MAIN,
      sub: storageGet(window.localStorage, GRAPHIC_SUB_KEY) || DEFAULT_SUB
    });
  }

  function writeState(next) {
    var current = readState();
    var state = normalise({
      main: next && next.main ? next.main : current.main,
      sub: next && next.sub ? next.sub : current.sub
    });
    storageSet(window.sessionStorage, SESSION_KEY, JSON.stringify(state));
    storageSet(window.localStorage, 'rb_tab', state.main);
    if (next && next.sub) storageSet(window.localStorage, GRAPHIC_SUB_KEY, state.sub);
    return state;
  }

  function findMainButton(main) {
    var buttons = document.querySelectorAll('nav button[onclick]');
    for (var i = 0; i < buttons.length; i++) {
      var code = buttons[i].getAttribute('onclick') || '';
      if (code.indexOf("'" + main + "'") >= 0 || code.indexOf('"' + main + '"') >= 0) return buttons[i];
    }
    return null;
  }

  function annotateGraphicButtons() {
    var root = document.getElementById('tab-team');
    if (!root || root.getAttribute('data-graphic-init') !== '1') return false;
    var buttons = root.querySelectorAll('.gsnav-btn');
    var panels = root.querySelectorAll('.gsp[data-sub]');
    for (var i = 0; i < buttons.length; i++) {
      var sub = panels[i] && panels[i].getAttribute('data-sub');
      if (sub) buttons[i].setAttribute('data-rb-sub', sub);
    }
    return buttons.length > 0;
  }

  function restoreGraphicSub(sub, attempt) {
    attempt = attempt || 0;
    if (annotateGraphicButtons()) {
      var root = document.getElementById('tab-team');
      var button = root.querySelector('.gsnav-btn[data-rb-sub="' + sub + '"]');
      if (!button) button = root.querySelector('.gsnav-btn[data-rb-sub="' + DEFAULT_SUB + '"]');
      if (button) {
        button.click();
        writeState({ main: 'team', sub: button.getAttribute('data-rb-sub') || DEFAULT_SUB });
        document.documentElement.setAttribute('data-rb-view-restored', '1');
        return;
      }
    }
    if (attempt < 30) {
      window.setTimeout(function () { restoreGraphicSub(sub, attempt + 1); }, 50);
    } else {
      document.documentElement.setAttribute('data-rb-view-restored', 'fallback');
    }
  }

  function restore() {
    var state = readState();
    var button = findMainButton(state.main);
    if (typeof window.showTab === 'function' && button) {
      window.showTab(state.main, button);
    } else {
      var panels = document.querySelectorAll('.tab-panel');
      for (var i = 0; i < panels.length; i++) panels[i].classList.remove('active');
      var target = document.getElementById('tab-' + state.main);
      if (target) target.classList.add('active');
    }
    writeState({ main: state.main });
    if (state.main === 'team') restoreGraphicSub(state.sub, 0);
    else document.documentElement.setAttribute('data-rb-view-restored', '1');
  }

  var originalShowTab = window.showTab;
  if (typeof originalShowTab === 'function') {
    window.showTab = function (name) {
      var result = originalShowTab.apply(this, arguments);
      if (mainExists(name)) writeState({ main: name });
      return result;
    };
  }

  var originalGoTab = window.goTab;
  if (typeof originalGoTab === 'function') {
    window.goTab = function (name) {
      var result = originalGoTab.apply(this, arguments);
      if (mainExists(name)) writeState({ main: name });
      return result;
    };
  }

  document.addEventListener('click', function (event) {
    var button = event.target && event.target.closest ? event.target.closest('.gsnav-btn') : null;
    if (!button) return;
    annotateGraphicButtons();
    var sub = button.getAttribute('data-rb-sub');
    if (sub) writeState({ main: 'team', sub: sub });
  });

  window.addEventListener('pageshow', function (event) {
    if (event.persisted) restore();
  });

  window._rbNavigationStateTest = {
    readState: readState,
    writeState: writeState,
    normalise: normalise,
    annotateGraphicButtons: annotateGraphicButtons
  };

  restore();
})();
