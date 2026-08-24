const assert = require('node:assert/strict');
const fs = require('node:fs');

const storage = new Map();
const ui = {
  'cti-batch-name': { value: 'WOLF+ quota test' },
  'cti-commit': { disabled: false },
  'cti-progress': { classList: { add() {} } },
  'cti-bar': { style: {} },
  'cti-progress-text': { textContent: '' }
};
let quota = false;
let cloudPayload = null;
global.window = global;
global.__CT_IMPORT_TEST__ = true;
global.document = {
  hidden: false,
  readyState: 'loading',
  addEventListener() {},
  getElementById(id) { return ui[id] || null; },
  querySelector(selector) {
    if (selector.includes('cti-mode')) return { value: 'append' };
    return null;
  },
  querySelectorAll() { return []; }
};
global.localStorage = {
  getItem(key) { return storage.has(key) ? storage.get(key) : null; },
  setItem(key, value) {
    if (quota && key === 'rb_olympplus_v1') throw new Error('QuotaExceededError');
    storage.set(key, String(value));
  },
  removeItem(key) { storage.delete(key); }
};
global.navigator = { onLine: true };
global.addEventListener = () => {};
global.dispatchEvent = () => {};
global.CustomEvent = function CustomEvent(type) { this.type = type; };
global.AbortController = class AbortController { constructor() { this.signal = {}; } abort() {} };
global.setTimeout = () => 1;
global.clearTimeout = () => {};
global.alert = () => {};
global.confirm = () => true;
global.fetch = (url, options) => {
  cloudPayload = JSON.parse(options.body);
  return Promise.resolve({ ok: true });
};
global._ctData = Array.from({ length: 2339 }, (_, i) => ({ id: `old-${i}`, brand: 'WOLF+', script: `old-${i}` }));
storage.set('rb_olympplus_v1', JSON.stringify(global._ctData));

eval(fs.readFileSync('snippets/bulk-import-v2.js', 'utf8'));
eval(fs.readFileSync('snippets/bulk-import-v3.js', 'utf8'));
eval(fs.readFileSync('snippets/performance-v4.js', 'utf8'));

const rows = window.ctParseCSV([
  'สคริป,ลิงค์คลิป,ชื่อคอนเท้นท์,ท่อนฮุก',
  'new-1,clip-1,content-1,hook-1',
  'new-2,clip-2,content-2,hook-2',
  'new-3,clip-3,content-3,hook-3',
  'new-4,clip-4,content-4,hook-4',
  ',,,'
].join('\n'));
const analysis = window._ctImportV3Test.load(rows, 'WOLF+');
assert.equal(analysis.selected, 4);
quota = true;
window.ctImportCommit();

Promise.resolve().then(() => Promise.resolve()).then(() => {
  assert.ok(cloudPayload, 'เมื่อพื้นที่เครื่องเต็มต้องส่งข้อมูลไปฐานข้อมูลออนไลน์');
  assert.equal(cloudPayload.items.length, 2343, 'ข้อมูลเดิมและข้อมูลใหม่ต้องขึ้นออนไลน์ครบ');
  assert.equal(global._ctData.length, 2343, 'ข้อมูลในหน้าปัจจุบันต้องไม่หาย');
  assert.equal(ui['cti-bar'].style.width, '100%');
  assert.match(ui['cti-progress-text'].textContent, /บันทึกออนไลน์โดยตรง/);
  assert.equal(ui['cti-commit'].disabled, true, 'ห้ามกดยืนยันซ้ำระหว่างบันทึก');
  console.log('import-quota-fallback-v267: all tests passed');
}).catch(error => { console.error(error); process.exitCode = 1; });
