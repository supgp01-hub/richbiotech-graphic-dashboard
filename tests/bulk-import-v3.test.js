const assert = require('node:assert/strict');
const fs = require('node:fs');

global.window = global;
global.__CT_IMPORT_TEST__ = true;
global.document = {
  readyState: 'loading', addEventListener() {}, getElementById() { return null; },
  querySelector() { return null; }, querySelectorAll() { return []; }
};
const storage = new Map();
global.localStorage = {
  getItem(key) { return storage.has(key) ? storage.get(key) : null; },
  setItem(key, value) { storage.set(key, value); }, removeItem(key) { storage.delete(key); }
};
global.ctLoad = () => [];

eval(fs.readFileSync('snippets/bulk-import-v2.js', 'utf8'));
eval(fs.readFileSync('snippets/bulk-import-v3.js', 'utf8'));

const csvPath = 'C:/Users/adsri/Downloads/SUPERVISOR ADS X RICHBIOTECH  - ชีต48.csv';
const csvFixture = [
  'สคริป,ลิงค์คลิป,ชื่อคอนเท้นท์,ท่อนฮุก',
  ',,,',
  'script-a,https://clip.example/a,คอนเทนต์ตัวอย่าง,ฮุกตัวอย่าง'
].join('\n');
const rows = window.ctParseCSV(fs.existsSync(csvPath) ? fs.readFileSync(csvPath, 'utf8') : csvFixture);
const result = window._ctImportV3Test.load(rows, 'So Pink');

assert.equal(result.source, rows.length - 1, 'ต้องแสดงข้อมูลครบทุกแถวหลังหัวตาราง');
assert.equal(result.bad, 1, 'ต้องแสดงแถวว่างหนึ่งแถวเป็นรายการที่ต้องตรวจ');

const duplicateFixture = window.ctParseCSV([
  'สคริป,ลิงค์คลิป,ชื่อคอนเท้นท์,ท่อนฮุก',
  ',,,',
  'script-a,clip-a,content-a,hook-a',
  'script-a,clip-a,content-a,hook-a',
  'script-b,clip-b,content-b,hook-b',
  'script-b,clip-b,content-b,hook-b'
].join('\n'));
const duplicateResult = window._ctImportV3Test.load(duplicateFixture, 'So Pink');
assert.equal(duplicateResult.source, 5);
assert.equal(duplicateResult.bad, 1);
assert.equal(duplicateResult.groups.length, 2, 'ต้องจัดรายการซ้ำเป็นกลุ่ม');
assert.equal(duplicateResult.dupRows, 4, 'สองกลุ่มซ้ำต้องประกอบด้วยสี่แถว');
assert.equal(duplicateResult.selected, 2, 'ค่าเริ่มต้นต้องเลือกหนึ่งรายการต่อกลุ่มซ้ำ');
assert.deepEqual(duplicateResult.groups.map(group => group.fileRows), [[3,4],[5,6]]);

storage.set('rb_olympplus_v1', JSON.stringify([{
  brand: 'So Pink', script: 'script-a', clipLink: 'clip-a', episode: 'content-a', ready: 'hook-a'
}]));
const dashboardFixture = window.ctParseCSV([
  'สคริป,ลิงค์คลิป,ชื่อคอนเท้นท์,ท่อนฮุก',
  'script-a,clip-a,content-a,hook-a'
].join('\n'));
const dashboardResult = window._ctImportV3Test.load(dashboardFixture, 'So Pink');
assert.equal(dashboardResult.groups.length, 1, 'ต้องตรวจข้อมูลซ้ำกับ Dashboard ได้');
assert.equal(dashboardResult.groups[0].dashboard.length, 1);
assert.equal(dashboardResult.selected, 0, 'ข้อมูลซ้ำกับ Dashboard ต้องไม่ถูกเลือกอัตโนมัติ');

console.log('bulk-import-v3: all tests passed');
