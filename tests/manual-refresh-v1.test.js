const assert = require('node:assert/strict');
const fs = require('node:fs');

const index = fs.readFileSync('index.html', 'utf8');
const source = fs.readFileSync('snippets/manual-refresh-v1.js', 'utf8');
const editor = fs.readFileSync('snippets/list-facebook-editor.js', 'utf8');

assert.ok(index.includes('snippets/manual-refresh-v1.js?v=214'), 'manual refresh controller must be deployed');
assert.ok(source.includes("['sup','spec','graphic','ads','audit'].indexOf(role)>=0"), 'every active team role may refresh Facebook Pages and List Facebook');
assert.ok(source.includes("function canRefreshCommission(){var role=window._rbUser&&window._rbUser.role;return role==='sup'||role==='spec'||role==='audit'}"), 'commission refresh permissions must remain restricted');
assert.ok(source.includes('STALE_MS=20*60*1000'), 'cached data must be marked stale after 20 minutes');
assert.ok(source.includes('function initFbListManual()'), 'Facebook Pages must open from cache without an automatic network request');
assert.ok(source.includes('function installOverrides()'), 'manual Facebook functions must be restored after the Graphic page initializes');
assert.ok(source.includes("style.setProperty('display'"), 'refresh permissions must override legacy important button styles');
assert.ok(editor.includes('window.rbCanRefreshHeavy&&!window.rbCanRefreshHeavy()'), 'List Facebook refresh must enforce permissions in the action itself');
assert.ok(index.includes('Show the page immediately. Network synchronization must never block the click.'), 'the order screen must render before cloud synchronization');
assert.ok(index.includes("['sup','spec','graphic','ads','audit'].indexOf(role)<0"), 'the primary Facebook refresh function must allow every team role');
assert.ok(index.includes("localStorage.getItem('rb_fbpages_cache_v1')"), 'the primary Facebook page must open from cache');
assert.ok(source.includes("FB_CLOUD='/fbpages_base_snapshot'"), 'Facebook Pages must persist a shared internal snapshot');
assert.ok(source.includes('mergePages(stored,parsePages(res[0]))'), 'Facebook Pages refresh must add/update without replacing old data');
assert.ok(editor.includes("CLOUD_BASE='/listfacebook_base_snapshot'"), 'List Facebook must persist a shared internal snapshot');
assert.ok(editor.includes('current=replaceSourceRows(parseCsv(res[0]))'), 'List Facebook refresh must use the latest sheet snapshot as the authoritative count');
assert.equal(editor.includes('mergeRows(stored,parseCsv(res[0]))'), false, 'List Facebook refresh must not keep source rows that no longer exist in the sheet');

console.log('manual-refresh-v1: all tests passed');
