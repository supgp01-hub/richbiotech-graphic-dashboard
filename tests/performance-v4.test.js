const assert = require('node:assert/strict');
const fs = require('node:fs');

const storage = new Map();
const timers = [];
let fetchCalls = 0;
let cloudCalls = 0;
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
global.fbSet = (path, payload) => { cloudCalls++; storage.set('cloud:' + path, JSON.stringify(payload)); return Promise.resolve(true); };
global.navigator = { onLine: true };
global._ctData = Array.from({ length: 2135 }, (_, i) => ({ id: `row-${i}`, script: `script-${i}` }));
global.ctLoad = () => global._ctData;

eval(fs.readFileSync('snippets/performance-v4.js', 'utf8'));

(async () => {
  const started = Date.now();
  const result = await window.ctSave(global._ctData);
  assert.ok(Date.now() - started < 100, 'การบันทึกและยืนยันออนไลน์ต้องไม่ค้างหน้าจอ');
  assert.equal(result.local, true);
  assert.equal(result.cloud, true, 'ข้อมูลต้องได้รับการยืนยันว่าเขียนออนไลน์แล้ว');
  assert.equal(cloudCalls, 1, 'ต้องส่งขึ้นคิวออนไลน์ทันทีโดยไม่รอให้ผู้ใช้เปิดหน้าตารางค้างไว้');
  assert.ok(storage.get('rb_olympplus_v1').includes('row-2134'));
  assert.ok(!storage.has('rb_ct_sync_pending_v1'));

  forceQuota = true;
  fetchCalls = 0;
  cloudCalls = 0;
  const fallbackRows = [{ id: 'quota-row', script: 'saved online', clipLink: '', result: '' }];
  const fallback = await window.ctPersistContent(fallbackRows);
  assert.equal(fallback.cloud, true, 'พื้นที่ในเครื่องเต็มต้องสลับไปบันทึกออนไลน์โดยตรง');
  assert.equal(cloudCalls, 1, 'การบันทึกสำรองต้องส่งข้อมูลผ่านคิวออนไลน์ที่ลองใหม่ได้');
  assert.equal(global._ctData[0].id, 'quota-row', 'ข้อมูลใหม่ต้องคงอยู่ในหน้าปัจจุบัน');

  forceQuota = false;
  cloudCalls = 0;
  const remoteRows = Array.from({ length: 2169 }, (_, i) => ({ id: `safe-${i}`, script: `remote-${i}` }));
  global.fbGet = (_path, callback) => callback(null, { items: remoteRows });
  const staleRows = remoteRows.slice(0, 34);
  await window.ctPersistContent(staleRows);
  const protectedPayload = JSON.parse(storage.get('cloud:/content_tracker_v2'));
  assert.equal(protectedPayload.items.length, 2169, 'อุปกรณ์เก่าที่มีข้อมูลน้อยกว่าต้องไม่เขียนทับฐานข้อมูลชุดเต็ม');
  assert.equal(global._ctData.length, 2169, 'หน้าปัจจุบันต้องกู้รายการออนไลน์กลับมาให้อัตโนมัติ');
  console.log('performance-v4: all tests passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
