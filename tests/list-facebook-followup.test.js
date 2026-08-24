const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('snippets/list-facebook-followup.js', 'utf8');
assert.ok(source.includes('<strong>ติดตามบัญชี Facebook</strong>'));
assert.ok(!source.includes('<strong>ศูนย์ติดตามบัญชี Facebook</strong>'));

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

const day = 24 * 60 * 60 * 1000;
const baseNow = new Date(2026, 7, 23, 10, 0, 0).getTime();
assert.equal(api.automaticNextDate(baseNow), '2026-08-30', 'saving a follow-up must automatically schedule the next review seven days later');
assert.equal(api.followupTiming({}, baseNow).nextDate, '', 'accounts that have not been saved for follow-up must not receive a false deadline in the table');
assert.equal(api.followupTiming({ stage: 'working', updatedAt: baseNow, nextDate: '2026-08-30' }, baseNow).level, 0, 'the first day must use the grey severity');
assert.equal(api.followupTiming({ stage: 'working', updatedAt: baseNow, nextDate: '2026-08-30' }, baseNow + 6 * day).level, 6, 'severity must increase as the deadline approaches');
assert.equal(api.followupTiming({ stage: 'working', updatedAt: baseNow, nextDate: '2026-08-30' }, baseNow + 7 * day).level, 7, 'the seventh day must be the red deadline state');
assert.equal(api.followupTiming({ stage: 'done', updatedAt: baseNow }, baseNow + 7 * day).nextDate, '', 'completed work must not create another follow-up deadline');

assert.ok(source.includes("FOLLOW_CLOUD_PATH='/listfacebook_followups'"), 'follow-up data must use a separate cloud path');
assert.ok(source.includes('history=history.slice(0,20)'), 'follow-up history must be bounded for stability');
assert.ok(source.includes('window._lfbOpenEditor(selectedKey)'), 'the full account editor must remain available');
assert.ok(source.includes('class="lfb-table-center lfb-status-cell"'), 'status, workflow and update columns must use the centered table layout');
assert.equal(source.includes('setInterval('), false, 'the workflow must not add background polling that can destabilize multiple tabs');
assert.ok(source.includes("nextDate=stage==='done'?'':automaticNextDate(Date.now())"), 'saving must not require the team to pick the seven-day follow-up date manually');
assert.ok(source.includes("followView:'all'"), 'List Facebook must open on all accounts by default');
assert.ok(source.includes("defaultListView();hybridInit()"), 'returning to List Facebook must reset the workflow view to all accounts');
assert.ok(source.includes('aria-pressed="'), 'summary and workflow buttons must expose their selected state');
assert.ok(source.includes('<em>กำลังดู</em>'), 'the selected summary must visibly identify the current view');
assert.ok(source.includes("query.value=String(filter.q||'')"), 'returning to List Facebook must visibly clear a stale search query');

console.log('list-facebook-followup: all tests passed');
