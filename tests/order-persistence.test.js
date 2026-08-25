const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('index.html', 'utf8');
const auditPersistence = fs.readFileSync('snippets/order-audit-persistence-v1.js', 'utf8');

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
assert.ok(syncSave.includes('loadOrderSnapshot(LS_ORD)'), 'order and Audit saves must diff against the last committed snapshot, not the already-mutated live array');
assert.ok(syncSave.includes("if(!row._fbKey)row._fbKey='ord_'"), 'new rows need collision-safe internal keys');
assert.ok(!syncSave.includes('byId[row.id]'), 'visible GR numbers must not select a database record to overwrite');

assert.ok(html.includes('if(_omIsNew&&idx>=0)'), 'a stale new-order form must not replace an existing visible GR number');

const workflowStart = html.indexOf('function persistOMWorkflow(order,options)');
const workflowEnd = html.indexOf('\n  function saveOM2()', workflowStart);
const workflowSave = html.slice(workflowStart, workflowEnd);
assert.ok(workflowSave.includes('order.clipLinks='), 'employee clip links must be copied into the order before status changes');
assert.ok(workflowSave.includes('order.fixImages='), 'employee fix images must be copied into the order before status changes');
assert.ok(workflowSave.includes('order.errorImages='), 'audit images must be copied into the order before status changes');
assert.ok(html.includes('snippets/order-audit-persistence-v1.js?v=fix281'), 'Audit persistence helper must load before the order modal');
assert.ok(workflowSave.includes('window.rbPersistAuditFields(order,ge,document)'), 'every Audit status action must collect the full Audit form');

const fakeFields = {
  'om-fbname': {value: 'Facebook Account'},
  'om-pagename': {value: 'Page Name'},
  'om-fbuplist': {value: 'อัพแล้วเรียบร้อย'},
  'om-contentuplist': {value: 'ยังไม่ได้อัพ'},
  'om-camp1': {value: 'Campaign 1'},
  'om-camp2': {value: 'Campaign 2'},
  'om-uplink': {value: 'https://example.com/ver-1'},
  'om-ad': {value: 'https://example.com/ver-2'},
  'om-audit-note': {value: 'Audit note'},
  'om-camp3': {value: 'Campaign 3'},
  'om-link3': {value: 'https://example.com/ver-3'}
};
const sandbox = {window: {}, document: {querySelectorAll: () => [{}]}};
vm.runInNewContext(auditPersistence, sandbox);
const savedAudit = {};
sandbox.window.rbPersistAuditFields(savedAudit, (id) => fakeFields[id] || null, sandbox.document);
assert.equal(savedAudit.fbName, 'Facebook Account');
assert.equal(savedAudit.pageName, 'Page Name');
assert.equal(savedAudit.fbUpList, 'อัพแล้วเรียบร้อย');
assert.equal(savedAudit.contentUpList, 'ยังไม่ได้อัพ');
assert.equal(savedAudit.camp1, 'Campaign 1');
assert.equal(savedAudit.camp2, 'Campaign 2');
assert.equal(savedAudit.auditNote, 'Audit note');
assert.equal(savedAudit.campExtra.length, 1);
assert.equal(savedAudit.campExtra[0].name, 'Campaign 3');
assert.equal(savedAudit.campExtra[0].link, 'https://example.com/ver-3');
assert.ok((html.match(/persistOMWorkflow\(orders\[idx\]\)/g)||[]).length >= 2, 'audit review actions must persist modal data before changing status');
assert.ok(html.includes("persistOMWorkflow(orders[idx],{revisionSubmit:_cst==='revision'});orders[idx].status=_nst"), 'resubmission must append its latest attachments without overwriting the original links');

assert.ok(html.includes("else if(_cr0==='audit')window._ordViewMode='audit'"), 'Audit users must not be opened in employee/team mode');
assert.ok(html.includes("isAuditRole=role==='audit',canAudit=role==='sup'||isAuditRole"), 'the footer must recognize the Audit role explicitly');
assert.ok(html.includes("_orderRole==='audit'?'ตรวจหลักฐานและบันทึกผลออดิต'"), 'Audit orders must show unambiguous Audit guidance');
assert.ok(html.includes("} else if(_isAuditView) {"), 'the normal order-save action must stay hidden in Audit mode');
assert.ok(html.includes("k==='team'&&_tabRole!=='sup'"), 'Supervisor must keep the add-order button in team view');

console.log('order-persistence: all tests passed');
