const assert = require('node:assert/strict');
const fs = require('node:fs');

const index = fs.readFileSync('index.html', 'utf8');
const runtime = fs.readFileSync('snippets/runtime-stability-v2.js', 'utf8');
const cloud = fs.readFileSync('snippets/bulk-import-v2.js', 'utf8');
const performance = fs.readFileSync('snippets/performance-v4.js', 'utf8');

assert.ok(index.includes('snippets/runtime-stability-v2.js?v=207'), 'runtime stability controller must load');
assert.ok(index.includes('snippets/bulk-import-v2.js?v=207'), 'content cloud cache must be refreshed');
assert.ok(index.includes('snippets/performance-v4.js?v=267'), 'content sync cache must be refreshed');
assert.ok(runtime.includes("container.setAttribute('data-links-deferred','1')"), 'Content Tracker must not initialize with the Graphic page');
assert.ok(runtime.includes("sub.textContent.indexOf('รวมลิงก์')"), 'Content Tracker must initialize only after its tab is selected');
assert.ok(runtime.includes('window.ctCloudPause'), 'leaving Content Tracker must close its realtime stream');
assert.ok(cloud.includes('function cloudAllowed()'), 'cloud reads must be gated by the active Content Tracker tab');
assert.ok(cloud.includes('function cloudPause()'), 'inactive Content Tracker streams must be closed');
assert.ok(performance.includes('function trackerActive()'), 'large background writes must be gated by the active tab');
assert.ok(performance.includes('if(!trackerActive())return Promise.resolve(false)'), 'large data sync must not start on Dashboard login');

console.log('runtime-stability-v2: all tests passed');
