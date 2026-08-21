const assert = require('node:assert/strict');
const fs = require('node:fs');

const index = fs.readFileSync('index.html');
const source = index.toString('utf8');
const bulk = fs.readFileSync('snippets/bulk-import-v2.js', 'utf8');
const performance = fs.readFileSync('snippets/performance-v4.js', 'utf8');

assert.ok(index.length < 600000, 'initial dashboard HTML should stay below 600 KB');
assert.equal(index.includes(0), false, 'dashboard HTML must not contain null bytes');
assert.ok(source.includes('function fbFetch(url,opts,timeout)'), 'Firebase requests need a shared timeout wrapper');
assert.ok(source.includes("if(_fbRefreshActive){_fbRefreshAgain=true;return;}"), 'overlapping Firebase refreshes must be coalesced');
assert.ok(source.includes("_fbFallbackTimer?'เชื่อมต่อด้วยโหมดสำรอง':'เชื่อมต่อข้อมูลแล้ว'"), 'a successful fallback request must show the system as online');
assert.ok(source.includes("document.addEventListener('visibilitychange'"), 'hidden tabs must pause realtime work');
assert.ok(source.includes('Date.now()-_rbOrderContentCloudAt<120000'), 'large content data should be reused instead of downloaded for every modal');
assert.ok(source.includes('window.ctCloudInit)window.ctCloudInit()'), 'opening the tracker must start its cloud connection on demand');
assert.ok(source.includes('var CT_EMBED = [];'), 'large tracker seed must not be embedded in the initial page');
assert.ok(bulk.includes('window.ctCloudInit=cloudInit'), 'content tracker cloud startup must be exposed for lazy loading');
assert.ok(bulk.includes('ctl.abort()},12000'), 'content tracker download must time out instead of hanging indefinitely');
assert.equal(bulk.includes("document.addEventListener('DOMContentLoaded',cloudInit)"), false, 'content tracker must not download on every dashboard visit');
assert.ok(bulk.includes("cloudWrite||localStorage.getItem('rb_ct_sync_pending_v1')"), 'incoming cloud snapshots must not overwrite pending local content edits');
assert.ok(performance.includes("e.key!=='rb_olympplus_v1'"), 'content changes from another tab must update the current tab');

console.log('stability-v5: all tests passed');
