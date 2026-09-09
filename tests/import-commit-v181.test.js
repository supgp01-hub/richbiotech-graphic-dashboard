const assert = require('node:assert/strict');
const fs = require('node:fs');

const storage = new Map();
const timers = [];
const ui = {
  'cti-batch-name': { value: 'So Pink test' },
  'cti-commit': { disabled: false },
  'cti-progress': { classList: { add() {} } },
  'cti-bar': { style: {} },
  'cti-progress-text': { textContent: '' }
};
global.window = global;
global.__CT_IMPORT_TEST__ = true;
global.document = {
  readyState: 'loading', addEventListener() {},
  getElementById(id) { return ui[id] || null; },
  querySelector(selector) { return selector.includes('cti-mode') ? { value: 'append' } : null; },
  querySelectorAll() { return []; }
};
global.localStorage = {
  getItem(key) { return storage.has(key) ? storage.get(key) : null; },
  setItem(key, value) { storage.set(key, value); }, removeItem(key) { storage.delete(key); }
};
global.setTimeout = (fn, ms) => { timers.push({ fn, ms }); return timers.length; };
global.clearTimeout = () => {};
global.alert = () => {};
global.confirm = () => true;
global.ctLoad = () => [];
let id = 0;
global.ctGenId = () => `imported-${++id}`;
global.ctRender = () => {};

eval(fs.readFileSync('snippets/bulk-import-v2.js', 'utf8'));
eval(fs.readFileSync('snippets/bulk-import-v3.js', 'utf8'));

// จำลอง Firebase ที่ไม่ตอบกลับ เพื่อยืนยันว่าหน้าจอไม่รอเครือข่าย
window.ctSave = () => new Promise(() => {});
const csv = ['สคริป,ลิงค์คลิป,ชื่อคอนเท้นท์,ท่อนฮุก'];
for (let i = 1; i <= 68; i++) csv.push(`script-${i},clip-${i},content-${i},hook-${i}`);
const rows = window.ctParseCSV(csv.join('\n'));
const analysis = window._ctImportV3Test.load(rows, 'So Pink');
assert.equal(analysis.selected, 68);

window.ctImportCommit();
Promise.resolve().then(() => {
  const saved = JSON.parse(storage.get('rb_olympplus_v1'));
  assert.equal(saved.length, 68, 'ต้องบันทึกรายการที่เลือกครบทุกแถวก่อนซิงก์');
  assert.equal(saved[0].brand, 'So Pink');
  assert.equal(saved[67].script, 'script-68');
  assert.equal(ui['cti-bar'].style.width, '100%');
  assert.match(ui['cti-progress-text'].textContent, /บันทึกสำเร็จ 68 รายการ/);
  assert.ok(timers.some(timer => timer.ms === 250), 'ต้องตั้งเวลาปิดหน้าต่างโดยไม่รอ Firebase');
  assert.ok(fs.readFileSync('index.html', 'utf8').includes('snippets/bulk-import-v3.js?v=fix418'), 'หน้าเว็บต้องโหลดตัวแก้นำเข้าเวอร์ชันล่าสุด');
  const originalId=saved[0].id;
  const submission={rowId:originalId,text:'employee text'};
  document.querySelector=()=>({value:'replace'});
  const repeat=window._ctImportV3Test.load(rows,'So Pink');
  repeat.items.forEach(x=>window._ctImportV3Test.state().selected[x.row]=true);
  window.ctImportCommit();
  const repeated=JSON.parse(storage.get('rb_olympplus_v1'));
  assert.equal(repeated[0].id,submission.rowId,'replacement preserves the unique HOOK identity used by employee text');
  assert.equal(repeated[0].ready,'hook-1');
  assert.equal(repeated[0].clipLink,'clip-1');
  assert.equal(submission.text,'employee text');
  console.log('import-commit-v181: all tests passed');
}).catch(error => { console.error(error); process.exitCode = 1; });
