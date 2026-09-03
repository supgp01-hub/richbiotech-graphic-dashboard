const assert = require('node:assert/strict');
const fs = require('node:fs');

global.window = global;
global.__CT_IMPORT_TEST__ = true;
global.document = {
  readyState: 'loading',
  addEventListener() {},
  getElementById() { return null; },
  querySelector() { return null; },
  querySelectorAll() { return []; }
};
const storage = new Map();
global.localStorage = {
  getItem(key) { return storage.has(key) ? storage.get(key) : null; },
  setItem(key, value) { storage.set(key, value); },
  removeItem(key) { storage.delete(key); }
};

eval(fs.readFileSync('snippets/bulk-import-v2.js', 'utf8'));

const csvPath = 'C:/Users/adsri/Downloads/SUPERVISOR ADS X RICHBIOTECH  - ชีต48.csv';
const csvFixture = [
  'สคริป,ลิงค์คลิป,ชื่อคอนเท้นท์,ท่อนฮุก',
  ',,,',
  'script-a,https://clip.example/a,คอนเทนต์ตัวอย่าง,ฮุกตัวอย่าง'
].join('\n');
const actual = window.ctParseCSV(fs.existsSync(csvPath) ? fs.readFileSync(csvPath, 'utf8') : csvFixture);
assert.ok(actual.length > 1, 'ไฟล์จริงต้องมีหัวตารางและข้อมูลอย่างน้อยหนึ่งแถว');
assert.deepEqual(actual[0], ['สคริป', 'ลิงค์คลิป', 'ชื่อคอนเท้นท์', 'ท่อนฮุก']);
assert.equal(actual.slice(1).filter(row => row.every(value => !String(value).trim())).length, 1);
assert.ok(actual.slice(1).filter(row => row.some(value => String(value).trim())).length > 0);

const multiline = 'สคริป,ลิงก์คลิป,ชื่อคอนเทนต์,ท่อนฮุก\r\n"https://script","https://clip","ชื่อ, มีจุลภาค","บรรทัดแรก\nบรรทัดสอง"\r\n';
const parsedMultiline = window.ctParseCSV(multiline);
assert.equal(parsedMultiline.length, 2);
assert.equal(parsedMultiline[1][2], 'ชื่อ, มีจุลภาค');
assert.equal(parsedMultiline[1][3], 'บรรทัดแรก\nบรรทัดสอง');

const remoteRows = Array.from({length:2169},(_,i)=>({id:`row-${i}`,clipLink:`https://example.com/${i}`}));
storage.set('rb_olympplus_v1', JSON.stringify(remoteRows.slice(0,34)));
storage.set('rb_ct_sync_pending_v1', 'stale');
window._ctApplyCloudForTest({items:remoteRows});
assert.equal(JSON.parse(storage.get('rb_olympplus_v1')).length,2169,'เครื่องที่ค้าง 34 รายการต้องรับชุดออนไลน์เต็มกลับมา');
assert.equal(storage.has('rb_ct_sync_pending_v1'),false,'สถานะรอซิงก์เก่าต้องไม่ขวางการกู้ชุดข้อมูลเต็ม');

console.log('bulk-import-v2: all tests passed');
