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

const workflowStart = html.indexOf('function persistOMWorkflow(order)');
const workflowEnd = html.indexOf('\n  function saveOM2()', workflowStart);
const workflowSave = html.slice(workflowStart, workflowEnd);
assert.ok(workflowSave.includes('order.clipLinks='), 'employee clip links must be copied into the order before status changes');
assert.ok(workflowSave.includes('order.fixImages='), 'employee fix images must be copied into the order before status changes');
assert.ok(workflowSave.includes('order.errorImages='), 'audit images must be copied into the order before status changes');
assert.ok((html.match(/persistOMWorkflow\(orders\[idx\]\)/g)||[]).length >= 3, 'review actions must persist modal data before changing status');
assert.ok(html.includes('persistOMWorkflow(ords[ix]);ords[ix].status=\'review\''), 'resubmission must save its latest attachments');

assert.ok(html.includes("else if(_cr0==='audit')window._ordViewMode='audit'"), 'Audit users must not be opened in employee/team mode');
assert.ok(html.includes("var isAuditRole=window._rbUser&&window._rbUser.role==='audit'"), 'the footer must recognize the Audit role explicitly');
assert.ok(html.includes("_isAuditView&&id?'ตรวจออดิต '"), 'Audit orders must show an unambiguous Audit heading');
assert.ok(html.includes("} else if(_isAuditView) {"), 'the normal order-save action must stay hidden in Audit mode');

console.log('order-persistence: all tests passed');
