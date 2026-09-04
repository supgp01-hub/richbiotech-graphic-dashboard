const assert = require('node:assert/strict');
const fs = require('node:fs');

const index = fs.readFileSync('index.html', 'utf8');
const runtime = fs.readFileSync('snippets/runtime-stability-v2.js', 'utf8');
const cloud = fs.readFileSync('snippets/bulk-import-v2.js', 'utf8');
const performance = fs.readFileSync('snippets/performance-v4.js', 'utf8');

assert.ok(index.includes('snippets/runtime-stability-v2.js?v=207'), 'runtime stability controller must load');
assert.ok(index.includes('snippets/bulk-import-v2.js?v=216'), 'content cloud cache must be refreshed');
assert.ok(index.includes('snippets/performance-v4.js?v=fix340'), 'content sync cache must be refreshed');
assert.ok(index.includes("typeof window.initLinksPanel==='function'"), 'Graphic must wait for Content Tracker initialization instead of crashing during a fast online boot');
assert.ok(index.includes('waitForLinksPanel(attempt+1)'), 'Graphic must retry Content Tracker initialization after later scripts finish loading');
assert.ok(runtime.includes("container.setAttribute('data-links-deferred','1')"), 'Content Tracker must not initialize with the Graphic page');
assert.ok(runtime.includes("sub.textContent.indexOf('รวมลิงก์')"), 'Content Tracker must initialize only after its tab is selected');
assert.ok(runtime.includes('window.ctCloudPause'), 'leaving Content Tracker must close its realtime stream');
assert.ok(cloud.includes('function hydrateCloud()'), 'every authenticated browser must hydrate Content Tracker before its tab is opened');
assert.ok(cloud.includes('},90000)'), 'authenticated Content Tracker hydration must allow large payloads to finish loading');
assert.ok(cloud.includes('function hydrateAfterAuth(attempt)'), 'hydration must wait for secure authentication even when scripts load in a different order');
assert.ok(cloud.includes('hydrateAfterAuth(attempt+1)'), 'authentication and large-download failures must retry without a manual refresh');
assert.ok(cloud.includes('รอโหลดออนไลน์ใหม่'), 'a failed online load must be visible instead of falsely reporting that data is ready');
assert.ok(cloud.includes('function cloudAllowed()'), 'realtime Content Tracker work must be gated by the active tab');
assert.ok(cloud.includes('function cloudPause()'), 'inactive Content Tracker streams must be closed');
assert.ok(performance.includes('function trackerActive()'), 'large background writes must be gated by the active tab');
assert.ok(performance.includes('window.rbFirebaseAuth&&window.rbFirebaseAuth.fetch'), 'large Content Tracker payloads must use the authenticated long-timeout transport');
assert.ok(performance.includes('},90000)'), 'large Content Tracker payloads must not inherit the 12-second global timeout');
assert.ok(performance.includes("if(manual)try{localStorage.setItem(SYNC_PENDING"), 'manual sync failures must remain queued and visible');
assert.ok(!performance.includes('if(!trackerActive())return Promise.resolve(false)'), 'pending business data must keep syncing after the user leaves the Content Tracker tab');

console.log('runtime-stability-v2: all tests passed');
