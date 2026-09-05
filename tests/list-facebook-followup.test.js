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
assert.equal(api.needsSystemFollowup({ st: 'เปลี่ยนเฟสใหม่แล้ว' }), false, 'a replaced Facebook account must leave the repair queue');
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
assert.equal(api.rowMeta({ _key: 'safe-marked', follow: 'ติดตาม', st: 'เปลี่ยนเฟสใหม่แล้ว' }).stage, 'none', 'safe Facebook statuses must override an old tracking mark');
assert.equal(api.rowMeta({ _key: 'safe-marked', follow: 'ติดตาม', st: 'เปลี่ยนเฟสใหม่แล้ว' }).marked, false, 'safe Facebook statuses must not remain in the marked tracking count');
assert.equal(api.normalizeStage('waiting'), 'working', 'legacy waiting stages must migrate to working');

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
assert.equal(api.followupTiming({ stage: 'none', updatedAt: baseNow, nextDate: '2026-08-30' }, baseNow).nextDate, '', 'non-tracked statuses must clear a stale follow-up date');
assert.equal(api.mergeFollowupMaps({ a: { updatedAt: 200, stage: 'none' } }, { a: { updatedAt: 100, stage: 'new' } }).a.stage, 'none', 'stale cloud tracking data must not overwrite a newer local closure');

assert.ok(source.includes("FOLLOW_CLOUD_PATH='/listfacebook_followups'"), 'follow-up data must use a separate cloud path');
assert.ok(source.includes('history=history.slice(0,20)'), 'follow-up history must be bounded for stability');
assert.ok(source.includes('<h3>แก้ไขข้อมูลบัญชี</h3>'), 'the full account editor must be permanently visible in the right panel');
assert.ok(source.includes('แก้ไขล่าสุด: '), 'the account editor header must show the latest edit date and time');
assert.ok(source.includes('accountUpdatedWhen(row)'), 'the visible latest-edit time must use the saved account timestamp');
assert.ok(source.includes("event.stopImmediatePropagation();\n    openFollowupModal(nameButton.getAttribute('data-key'))"), 'clicking an account name must open only the follow-up popup and suppress the legacy account popup');
assert.ok(source.includes('id="lfb-followup-title">แก้ไขข้อมูลติดตาม'), 'the tracking popup must have a clear edit-follow-up title');
assert.ok(source.includes('window._lfbSaveAccountRecord(selectedKey,values)'), 'right-panel edits must use the existing account persistence path');
assert.ok(source.includes('id="lfb-credentials-open"'), 'the permanent account editor must expose a clear more-information control');
assert.ok(source.includes('id="lfb-credentials-drawer"'), 'login details must live in the compact left drawer instead of the permanent form');
assert.ok(source.includes('id="lfb-credentials-edit"'), 'the credentials drawer must require an explicit edit action');
assert.ok(source.includes('id="lfb-credentials-cancel"') && source.includes('id="lfb-credentials-save"'), 'credential editing must support safe cancel and save actions');
assert.ok(source.indexOf('<section class="lfb-account-section"><strong>ข้อมูลเข้าสู่ระบบ</strong>')===-1, 'login details must not consume permanent right-panel space');
assert.ok(source.includes('class="lfb-table-center lfb-status-cell"'), 'status, workflow and update columns must use the centered table layout');
assert.equal(source.includes('setInterval('), false, 'the workflow must not add background polling that can destabilize multiple tabs');
assert.ok(source.includes("nextDate=stage==='done'?'':automaticNextDate(Date.now())"), 'saving must not require the team to pick the seven-day follow-up date manually');
assert.ok(source.includes("followView:'all'"), 'List Facebook must open on all accounts by default');
assert.ok(source.includes("defaultListView();hybridInit()"), 'returning to List Facebook must reset the workflow view to all accounts');
assert.ok(source.includes('aria-pressed="'), 'summary and workflow buttons must expose their selected state');
assert.ok(source.includes('<em>กำลังดู</em>'), 'the selected summary must visibly identify the current view');
assert.ok(source.includes("query.value=String(filter.q||'')"), 'returning to List Facebook must visibly clear a stale search query');
assert.equal(source.includes("['waiting','รอ Facebook']"), false, 'รอ Facebook must be removed from every tracking-stage selector and summary');
assert.ok(source.includes('window._lfbReconcileFollowupStatus=reconcileFollowupStatus'), 'Facebook status saves must reconcile the shared tracking record');
assert.ok(source.includes('id="lfbi-follow-date" type="date"'), 'account status editing must show the next follow-up date in the same panel');
assert.ok(source.includes("updateAccountFollowupDate(event.target.value)"), 'the date field must react immediately to the existing status rules');
assert.ok(source.includes('values.followupNextDate=needsSystemFollowup'), 'account saves must forward the selected follow-up date only for tracked statuses');
assert.ok(source.includes("stage:nextStage,nextDate:nextDate"), 'a tracked status save must create a dated follow-up record for the table');
assert.ok(source.includes("detail.getAttribute('data-editing')!=='1'"), 'background refreshes must not replace the account form while a user is typing');
assert.ok(source.includes("detail.setAttribute('data-editing','1')"), 'typing in the account form must enter a protected editing state');
assert.ok(source.includes("root.querySelector('#lfb-editor-overlay')"), 'the List Facebook workspace must rebuild if its add/edit dialog is missing');

console.log('list-facebook-followup: all tests passed');
