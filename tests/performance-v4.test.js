const assert = require('node:assert/strict');
const fs = require('node:fs');

const storage = new Map();
const timers = [];
let fetchCalls = 0;
let forceQuota = false;
global.window = global;
global.addEventListener = () => {};
global.document = {
  readyState: 'loading', hidden: false,
  addEventListener() {}, querySelector() { return null; }, getElementById() { return null; }
};
global.localStorage = {
  getItem(key) { return storage.has(key) ? storage.get(key) : null; },
  setItem(key, value) { if (forceQuota && key === 'rb_olympplus_v1') throw new Error('QuotaExceededError'); storage.set(key, value); },
  removeItem(key) { storage.delete(key); }
};
global.setTimeout = (fn, ms) => { timers.push({ fn, ms }); return timers.length; };
global.clearTimeout = () => {};
global.fetch = () => { fetchCalls++; return Promise.resolve({ ok: true }); };
global.navigator = { onLine: true };
global._ctData = Array.from({ length: 2135 }, (_, i) => ({ id: `row-${i}`, script: `script-${i}` }));
global.ctLoad = () => global._ctData;

eval(fs.readFileSync('snippets/performance-v4.js', 'utf8'));

(async () => {
  const started = Date.now();
  const result = await window.ctSave(global._ctData);
  assert.ok(Date.now() - started < 100, 'การบันทึกหน้าจอต้องเสร็จทันทีโดยไม่รอเครือข่าย');
  assert.equal(result.local, true);
  assert.equal(fetchCalls, 0, 'ต้องยังไม่ส่งเครือข่ายก่อนครบช่วง debounce');
  assert.ok(storage.get('rb_olympplus_v1').includes('row-2134'));
  assert.ok(storage.has('rb_ct_sync_pending_v1'));
  assert.ok(timers.some(timer => timer.ms <= 450), 'ต้องตั้งคิวซิงก์เบื้องหลัง');

  forceQuota = true;
  fetchCalls = 0;
  const fallbackRows = [{ id: 'quota-row', script: 'saved online', clipLink: '', result: '' }];
  const fallback = await window.ctPersistContent(fallbackRows);
  assert.equal(fallback.cloud, true, 'พื้นที่ในเครื่องเต็มต้องสลับไปบันทึกออนไลน์โดยตรง');
  assert.equal(fetchCalls, 1, 'การบันทึกสำรองต้องส่งข้อมูลขึ้นฐานข้อมูลหนึ่งครั้ง');
  assert.equal(global._ctData[0].id, 'quota-row', 'ข้อมูลใหม่ต้องคงอยู่ในหน้าปัจจุบัน');
  console.log('performance-v4: all tests passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
