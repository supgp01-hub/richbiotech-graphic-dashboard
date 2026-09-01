const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'snippets', 'stable-public-url-v1.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

let replaced = '';
const window = {
  location: {
    href: 'https://supgp01-hub.github.io/richbiotech-graphic-dashboard/index.html?v=fix301&t=1788280000000',
    origin: 'https://supgp01-hub.github.io',
    pathname: '/richbiotech-graphic-dashboard/index.html',
    search: '?v=fix301&t=1788280000000',
    hash: ''
  },
  history: {
    state: { screen: 'orders' },
    replaceState(state, title, url) { replaced = url; }
  }
};
const sandbox = { window, document: { title: 'Dashboard' }, URL };

vm.runInNewContext(source, sandbox);

const normalize = window._rbStablePublicUrlTest.normalizePublicUrl;
assert.strictEqual(replaced, '/richbiotech-graphic-dashboard/');
assert.strictEqual(
  normalize('https://supgp01-hub.github.io/richbiotech-graphic-dashboard/index.html?v=fix302#orders'),
  '/richbiotech-graphic-dashboard/#orders'
);
assert.strictEqual(
  normalize('https://supgp01-hub.github.io/richbiotech-graphic-dashboard/index.html?role=sup&v=fix302'),
  '/richbiotech-graphic-dashboard/?role=sup'
);
assert.strictEqual(
  normalize('https://supgp01-hub.github.io/richbiotech-graphic-dashboard/?role=sup'),
  '/richbiotech-graphic-dashboard/?role=sup'
);

assert.ok(index.includes('<link rel="canonical" href="https://supgp01-hub.github.io/richbiotech-graphic-dashboard/">'));
assert.ok(index.includes('snippets/stable-public-url-v1.js?v=fix302'));
assert.ok(index.includes('<meta name="rb-build" content="fix305-del">'));

console.log('stable-public-url-v1: all tests passed');
