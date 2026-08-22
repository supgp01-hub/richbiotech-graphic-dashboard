const assert = require('node:assert/strict');
const fs = require('node:fs');

const index = fs.readFileSync('index.html', 'utf8');
const source = fs.readFileSync('snippets/manual-refresh-v1.js', 'utf8');
const editor = fs.readFileSync('snippets/list-facebook-editor.js', 'utf8');

assert.ok(index.includes('snippets/manual-refresh-v1.js?v=209'), 'manual refresh controller must be deployed');
assert.ok(source.includes("role==='sup'||role==='spec'||role==='audit'"), 'only Supervisor, Specialist and Audit may refresh heavy data');
assert.ok(source.includes('STALE_MS=20*60*1000'), 'cached data must be marked stale after 20 minutes');
assert.ok(source.includes("window._initFbList=function()"), 'Facebook Pages must open from cache without an automatic network request');
assert.ok(source.includes("window._lfbFetch=function()"), 'Facebook Pages must still support a manual refresh');
assert.ok(editor.includes('window.rbCanRefreshHeavy&&!window.rbCanRefreshHeavy()'), 'List Facebook refresh must enforce permissions in the action itself');
assert.ok(index.includes('Show the page immediately. Network synchronization must never block the click.'), 'the order screen must render before cloud synchronization');

console.log('manual-refresh-v1: all tests passed');
