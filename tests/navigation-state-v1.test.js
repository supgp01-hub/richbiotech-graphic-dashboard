const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const source = fs.readFileSync('snippets/navigation-state-v1.js', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');

function storage(initial) {
  const data = Object.assign({}, initial);
  return {
    getItem(key) { return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null; },
    setItem(key, value) { data[key] = String(value); }
  };
}

const existing = new Set(['overview', 'team', 'schedule', 'brands']);
const context = {
  window: null,
  localStorage: storage({ rb_tab: 'schedule', rb_graphic_sub_v1: 'listfb' }),
  sessionStorage: storage(),
  document: {
    documentElement: { setAttribute() {} },
    getElementById(id) { return existing.has(id.replace(/^tab-/, '')) ? { id, classList: { add() {}, remove() {} } } : null; },
    querySelector(selector) {
      if (selector === '.tab-panel[id^="tab-"]') return { id: 'tab-overview' };
      return null;
    },
    querySelectorAll() { return []; },
    addEventListener() {}
  },
  setTimeout() {},
  addEventListener() {},
  console
};
context.window = context;
vm.runInNewContext(source, context);

const api = context._rbNavigationStateTest;
assert.ok(api, 'navigation state test API must be available');
assert.deepStrictEqual(JSON.parse(JSON.stringify(api.readState())), { main: 'schedule', sub: 'listfb' }, 'local fallback restores the last main page and Graphic subpage');

api.writeState({ main: 'team', sub: 'order' });
assert.deepStrictEqual(JSON.parse(JSON.stringify(api.readState())), { main: 'team', sub: 'order' }, 'session state remembers a Graphic subpage for this browser tab');

assert.deepStrictEqual(JSON.parse(JSON.stringify(api.normalise({ main: 'missing', sub: 'missing' }))), { main: 'overview', sub: 'team' }, 'missing or inaccessible views fall back safely');
assert.ok(source.includes("sessionStorage"), 'each browser tab must keep an independent refresh location');
assert.ok(source.includes("event.persisted"), 'back-forward cache restoration must be supported');
assert.ok(!source.includes('setInterval('), 'navigation restoration must not add a permanent polling loop');
assert.ok(index.includes('snippets/navigation-state-v1.js?v=224'), 'the deployed page must load the cache-busted navigation module');
assert.ok(index.includes('<meta name="rb-build" content="fix354">'), 'the deployed page must expose the current build');

console.log('navigation-state-v1: all tests passed');
