const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('index.html', 'utf8');

const legacyStart = html.indexOf('window.gsOrdModal=function(oId)');
const legacyEnd = html.indexOf('\nfunction saveOrder()', legacyStart);
const legacyModal = html.slice(legacyStart, legacyEnd);
assert.ok(legacyModal.includes('ent.errorImages=JSON.parse(JSON.stringify(gsErrImgs))'));
assert.ok(legacyModal.includes('ent.fixImages=JSON.parse(JSON.stringify(gsFixImgs))'));

const oldSaveStart = html.indexOf('function saveOrder()');
const oldSaveEnd = html.indexOf('\nfunction delOrder(', oldSaveStart);
const oldSave = html.slice(oldSaveStart, oldSaveEnd);
assert.ok(!oldSave.includes('gsErrImgs'), 'global save must not reference modal-local image arrays');
assert.ok(oldSave.includes('Object.assign({},old,entry)'), 'editing must retain fields not shown by the legacy form');

const syncStart = html.indexOf('function spORD(d)');
const syncEnd = html.indexOf('\nfunction lpTL()', syncStart);
const syncSave = html.slice(syncStart, syncEnd);
assert.ok(syncSave.includes("if(!row._fbKey)row._fbKey='ord_'"), 'new rows need collision-safe internal keys');
assert.ok(!syncSave.includes('byId[row.id]'), 'visible GR numbers must not select a database record to overwrite');

assert.ok(html.includes('if(_omIsNew&&idx>=0)'), 'a stale new-order form must not replace an existing visible GR number');

console.log('order-persistence: all tests passed');
