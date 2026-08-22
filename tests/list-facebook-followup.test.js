const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('snippets/list-facebook-followup.js', 'utf8');

global.window = global;
global.localStorage = { getItem() { return null; }, setItem() {} };
global.document = { getElementById() { return null; }, addEventListener() {} };
global.addEventListener = function() {};
global._lfbInit = function() {};
eval(source);

const api = global._lfbFollowupTest;
assert.ok(api, 'follow-up workflow must expose its smoke-test API');
assert.equal(api.isMarked({ follow: 'ติดตาม' }), true);
assert.equal(api.isMarked({ follow: '' }), false);
assert.equal(api.needsSystemFollowup({ st: 'ใช้งาน' }), false);
assert.equal(api.needsSystemFollowup({ st: 'ว่าง' }), false);
assert.equal(api.needsSystemFollowup({ st: 'ปิดใช้งาน' }), false, 'intentional team closure does not require account repair');
assert.equal(api.needsSystemFollowup({ st: 'เราปิดใช้งานบัญชีของคุณแล้ว' }), true, 'Facebook closure must be followed');
assert.equal(api.needsSystemFollowup({ st: 'ติด WHATAPP' }), true);

const rows = [
  { _key: 'a', follow: 'ติดตาม', st: 'ติด WHATAPP' },
  { _key: 'b', follow: '', st: 'บัญชีถูกจำกัด' },
  { _key: 'c', follow: '', st: 'ใช้งาน' }
];
const counts = api.stageCounts(rows);
assert.equal(counts.marked, 1);
assert.equal(counts.new, 1);
assert.equal(counts.recommended, 1);

global._lfbFilter = { q: 'account outside current filters', followView: 'stage', stage: 'new', fE: 'MOS' };
const searchRows = [
  { _key: 'search-hit', name: 'Account Outside Current Filters', emp: 'TER', st: 'ใช้งาน', follow: '' },
  { _key: 'search-miss', name: 'Another Account', emp: 'MOS', st: 'ติด WHATAPP', follow: 'ติดตาม' }
];
assert.deepEqual(api.filteredRows(searchRows).map(row => row._key), ['search-hit'], 'typing an account name must search all accounts without requiring employee or stage filters');

assert.ok(source.includes("FOLLOW_CLOUD_PATH='/listfacebook_followups'"), 'follow-up data must use a separate cloud path');
assert.ok(source.includes('history=history.slice(0,20)'), 'follow-up history must be bounded for stability');
assert.ok(source.includes('window._lfbOpenEditor(selectedKey)'), 'the full account editor must remain available');
assert.ok(source.includes('class="lfb-table-center lfb-status-cell"'), 'status, workflow and update columns must use the centered table layout');
assert.equal(source.includes('setInterval('), false, 'the workflow must not add background polling that can destabilize multiple tabs');

console.log('list-facebook-followup: all tests passed');
