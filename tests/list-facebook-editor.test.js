const assert = require('node:assert/strict');
const fs = require('node:fs');

const editorSource = fs.readFileSync('snippets/list-facebook-editor.js', 'utf8');
const indexSource = fs.readFileSync('index.html', 'utf8');

global.window = global;
global.localStorage = { getItem() { return null; }, setItem() {} };
global.document = { getElementById() { return null; } };
eval(editorSource);

assert.ok(editorSource.includes("pageSize:50"), 'large Facebook lists must be paginated at a lightweight page size');
assert.ok(editorSource.includes('visible=filtered.slice(start,start+size)'), 'only the current page may be rendered into the DOM');
assert.ok(indexSource.includes("list-facebook-editor.js?v=223"), 'the deployed page must cache-bust the current Facebook editor');
assert.ok(indexSource.includes('list-facebook-editor.css?v=223'), 'the deployed page must cache-bust the Facebook editor layout');
assert.ok(indexSource.includes('list-facebook-followup.css?v=223'), 'the deployed page must load the follow-up workspace layout');
assert.ok(indexSource.includes("list-facebook-followup.js?v=223"), 'the deployed page must load the follow-up workflow');
assert.ok(indexSource.includes('<meta name="rb-build" content="fix225">'), 'the deployed page must expose its current build for cache diagnosis');
assert.ok(indexSource.includes('no-cache, no-store, must-revalidate'), 'the dashboard HTML must discourage browsers from reusing a stale build');
assert.ok(indexSource.includes('if(s.k==="listfb")setTimeout(function(){if(window._lfbEditorActivate)window._lfbEditorActivate();},0)'), 'the List Facebook tab must activate the complete editor directly');
assert.ok(editorSource.includes('lfb-min-stats'), 'the selected minimal layout must use the compact three-state summary');
assert.ok(editorSource.includes('lfb-advanced-filters'), 'detailed filters must remain available without cluttering the page');
assert.ok(editorSource.includes('colspan="7"'), 'the minimal table must use the reduced seven-column layout');
assert.equal(editorSource.includes('activateEditor();\nsetTimeout(activateEditor'), false, 'the large Facebook table must not initialize in the background');
assert.equal(editorSource.includes('refreshData();window._listfbFetch();'), false, 'opening Graphic must not automatically download the Facebook sheet');
assert.ok(indexSource.includes('var shown=filtered.slice(0,60)'), 'the legacy Facebook Pages fallback must not render the full list');
assert.ok(editorSource.includes('window._lfbPage=function(delta)'), 'pagination controls must be interactive');
assert.ok(editorSource.includes('baseRows=parseCsv(csv);markSourceSchema()'), 'one-time migration must replace the stale sheet snapshot instead of appending duplicate source rows');

const csv = [
  'ประเภท,คอลัมน์ B,พนักงาน,สินค้า,คอลัมน์ E,สถานะ,ชื่อบัญชี,Facebook ID,รหัสผ่าน,Email,รหัส Email,2FA,คอลัมน์ M,คอลัมน์ N,ลิมิต/วัน,📌 ต้องติดตาม,อัปเดตล่าสุด,ยอดเงิน,หมายเหตุ',
  'บัญชีเล็ก,,MOS,Liv CARE,,ใช้งาน,Naga Ontare,1000012345678901,FbPass123,demo@example.com,MailPass456,ABCDEF123456,,,5000,ติดตาม,21/08/2569 16:44,5456.15,บัญชีหลัก',
  'บัญชีใหญ่,,DOM,Olymplus,,ว่าง,"ชื่อ, มีคอมมา",1000099999999999,P2,second@example.com,M2,ZXCVBN,,,12000,,20/08/2569 11:20,2052.30,"หมายเหตุ, ทดสอบ"',
  'บัญชีเล็ก,,VIEW,Liv CARE,,ว่าง,,,,,,,,,,,,,ข้อมูลยังไม่มีชื่อ'
].join('\n');

const rows = window._lfbEditorTest.parseCsv(csv);
assert.equal(rows.length, 3, 'rows with useful employee or status data must not be discarded when account credentials are incomplete');
assert.equal(rows[0].fbid, '1000012345678901');
assert.equal(rows[0].passFb, 'FbPass123');
assert.equal(rows[0].email, 'demo@example.com');
assert.equal(rows[0].emailPass, 'MailPass456');
assert.equal(rows[0].twofa, 'ABCDEF123456');
assert.equal(rows[0].follow, 'ติดตาม');
assert.equal(rows[0].note, 'บัญชีหลัก');
assert.equal(rows[1].name, 'ชื่อ, มีคอมมา');
assert.equal(rows[1].note, 'หมายเหตุ, ทดสอบ');
assert.equal(rows[2].emp, 'VIEW');
assert.equal(rows[2].sourceRow, 4);
assert.notEqual(window._lfbEditorTest.rowKey(rows[2]), window._lfbEditorTest.rowKey({ ...rows[2], sourceRow: 5 }), 'incomplete source rows must retain distinct stable identities');
assert.notEqual(window._lfbEditorTest.rowKey(rows[0]), window._lfbEditorTest.rowKey({ ...rows[0], sourceRow: 99 }), 'intentional duplicate accounts on different source rows must remain separate');
assert.deepEqual(window._lfbEditorTest.employeeValues(rows), ['DOM', 'MOS', 'VIEW']);

const key = window._lfbEditorTest.rowKey(rows[0]);
const merged = window._lfbEditorTest.applyStored(rows, { [key]: { note: 'แก้ไขแล้ว', bal: '6000' } }, [{ id: 'manual-1', name: 'บัญชีใหม่', fbid: '2000' }]);
assert.equal(merged.length, 4);
assert.equal(merged[0].note, 'แก้ไขแล้ว');
assert.equal(merged[0].bal, '6000');
assert.equal(merged[3]._source, 'manual');

const additive = window._lfbEditorTest.mergeRows(rows, [
  { ...rows[0], note: 'ข้อมูลใหม่จากต้นทาง' },
  { name: 'บัญชีเพิ่ม', fbid: '3000', email: 'new@example.com' }
]);
assert.equal(additive.rows.length, 4, 'source refresh must keep old rows and append only new rows');
assert.equal(additive.added, 1);
assert.equal(additive.rows[0].note, 'ข้อมูลใหม่จากต้นทาง');
const authoritative = window._lfbEditorTest.mergeRows(rows, [
  { ...rows[0], st: 'รหัส 2FA ผิด', follow: '' }
]);
assert.equal(authoritative.rows[0].st, 'รหัส 2FA ผิด', 'the current sheet status must replace the stale snapshot status');
assert.equal(authoritative.rows[0].follow, '', 'removing a follow-up mark in the source sheet must clear the stale mark');
assert.equal(window._lfbEditorTest.sourceSchemaCurrent({ schemaVersion: 3 }), true, 'the migrated shared snapshot must expose its schema version');
assert.equal(window._lfbEditorTest.sourceSchemaCurrent({}), false, 'old shared snapshots must trigger a one-time source migration');
const safe = window._lfbEditorTest.safeSnapshot(rows);
assert.equal('passFb' in safe[0], false, 'shared snapshot must not duplicate Facebook passwords');
assert.equal('emailPass' in safe[0], false, 'shared snapshot must not duplicate email passwords');
assert.equal(safe[0].twofa, 'ABCDEF123456', 'shared snapshot includes 2FA after explicit authorization');

console.log('list-facebook-editor: all tests passed');
