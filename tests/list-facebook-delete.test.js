const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('snippets/list-facebook-editor.js', 'utf8');
const values = new Map();
const writes = [];

global.window = global;
global.document = { getElementById() { return null; } };
global.localStorage = {
  getItem(key) { return values.has(key) ? values.get(key) : null; },
  setItem(key, value) { values.set(key, String(value)); }
};
global._rbUser = { name: 'View', role: 'sup' };
global.fbSet = (path, value) => { writes.push({ path, value }); return Promise.resolve(true); };
eval(source);

(async () => {
  const sheetRow = { _key: 'sheet-key', _source: 'sheet', name: 'Sheet Account', fbid: '10001', email: 'sheet@example.com' };
  global._listfbData = [sheetRow];
  const sheetResult = await global._lfbDeleteAccountRecord('sheet-key');
  assert.equal(sheetResult.online, true);
  assert.equal(global._listfbData.length, 0, 'a deleted sheet account must disappear immediately');
  const tombstones = JSON.parse(values.get('rb_listfacebook_edits_v1'));
  assert.equal(tombstones['sheet-key'].deleted, true);
  assert.equal(tombstones['sheet-key'].deletedBy, 'View');
  assert.ok(writes.some(write => write.path === '/listfacebook_edits/sheet-key' && write.value.deleted === true), 'sheet deletion must synchronize its tombstone');

  const manualRow = { _key: 'manual-key', _source: 'manual', id: 'manual-key', name: 'Manual Account', fbid: '20002' };
  global._listfbData = [manualRow];
  const manualResult = await global._lfbDeleteAccountRecord('manual-key');
  assert.equal(manualResult.online, true);
  assert.ok(writes.some(write => write.path === '/listfacebook_manual/manual-key' && write.value === null), 'manual deletion must remove the original shared record');
  assert.ok(writes.some(write => write.path === '/listfacebook_edits/manual-key' && write.value.deleted === true), 'manual deletion must also synchronize a tombstone');

  console.log('list-facebook-delete: durable deletion checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
