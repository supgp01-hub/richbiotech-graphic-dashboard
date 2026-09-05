const assert = require('node:assert/strict');
const fs = require('node:fs');

const index = fs.readFileSync('index.html');
const source = index.toString('utf8');
const bulk = fs.readFileSync('snippets/bulk-import-v2.js', 'utf8');
const performance = fs.readFileSync('snippets/performance-v4.js', 'utf8');

// The order durability receipt and lazy image-evidence migration add a small
// client-side safety layer while removing multi-megabyte image blobs from the
// list response. Keep the shell bounded, but allow that deliberate trade-off.
assert.ok(index.length < 635000, 'initial dashboard HTML should stay below 635 KB');
assert.equal(index.includes(0), false, 'dashboard HTML must not contain null bytes');
assert.ok(source.includes('function fbFetch(url,opts,timeout)'), 'Firebase requests need a shared timeout wrapper');
assert.ok(source.includes('function fbWaitForAuth(timeout)'), 'Firebase reads must wait for the secure auth module');
assert.ok(source.includes('fbWaitForAuth(limit).then(function(auth){return auth.fetch(url,options);})'), 'Firebase reads must not fall back to anonymous requests while authentication starts');
assert.ok(source.includes("if(_fbRefreshActive){_fbRefreshAgain=true;return;}"), 'overlapping Firebase refreshes must be coalesced');
assert.ok(source.includes("_fbFallbackTimer?'เชื่อมต่อด้วยโหมดสำรอง':'เชื่อมต่อข้อมูลแล้ว'"), 'a successful fallback request must show the system as online');
assert.ok(source.includes("document.addEventListener('visibilitychange'"), 'hidden tabs must pause realtime work');
assert.ok(source.includes('Date.now()-_rbOrderContentCloudAt<120000'), 'large content data should be reused instead of downloaded for every modal');
assert.ok(source.includes('window.ctCloudInit)window.ctCloudInit()'), 'opening the tracker must start its cloud connection on demand');
assert.ok(source.includes('var CT_EMBED = [];'), 'large tracker seed must not be embedded in the initial page');
assert.ok(bulk.includes('window.ctCloudInit=cloudInit'), 'content tracker cloud startup must be exposed for lazy loading');
assert.ok(bulk.includes("typeof window.fbGet==='function'"), 'content tracker downloads must use the authenticated Firebase timeout wrapper');
assert.equal(bulk.includes("document.addEventListener('DOMContentLoaded',cloudInit)"), false, 'content tracker must not download on every dashboard visit');
assert.ok(bulk.includes("if(pending){var staleSnapshot="), 'a much larger online tracker must recover a stale device even when an old pending marker remains');
assert.ok(bulk.includes('mergePendingWithCloud(remoteItems,local)'), 'pending local additions must be preserved while recovering the complete online tracker');
assert.ok(bulk.includes("addEventListener('rb:auth-ready'"), 'a newly signed-in browser must reload tracker data immediately after Firebase authentication');
assert.ok(bulk.includes("hydrateCloud().then(function(){if(cloudAllowed())cloudInit()})"), 'fresh browsers must download the complete tracker after authentication even before its tab is opened');
assert.ok(bulk.includes('window._ctCloudRows=items'), 'a large authenticated snapshot must remain renderable when localStorage is full');
assert.ok(source.includes('if(Array.isArray(window._ctCloudRows))return window._ctCloudRows'), 'the tracker must prefer its verified in-memory Firebase snapshot over a stale browser cache');
assert.ok(bulk.includes("typeof window.fbGet==='function'"), 'Content Tracker reads must use the authenticated Firebase transport');
assert.ok(bulk.includes('auth.urlWithAuth(cloudUrl())'), 'Content Tracker realtime updates must carry Firebase authentication');
assert.ok(bulk.includes("if(!items.length&&local.length)"), 'an empty cloud snapshot must not erase populated local tracker data');
assert.ok(source.includes("window.fbGet('/content_tracker_v2'"), 'order forms must load Content Tracker through authenticated Firebase reads');
assert.ok(source.includes("rb_ct_backup_v1"), 'tracker data must be backed up before a cloud refresh replaces local rows');
assert.ok(performance.includes("e.key!=='rb_olympplus_v1'"), 'content changes from another tab must update the current tab');
assert.ok(performance.includes("BACKUP_KEY='rb_ct_backup_v1'"), 'local tracker edits must preserve the previous snapshot');
assert.ok(performance.includes('function protectAgainstRollback('), 'a stale device must not replace the complete online tracker with a smaller snapshot');
assert.ok(performance.includes('function mergeById('), 'rollback protection must retain online rows while applying current edits');

console.log('stability-v5: all tests passed');
