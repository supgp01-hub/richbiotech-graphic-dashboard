const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('index.html', 'utf8');
const source = fs.readFileSync('snippets/leave-workforce-v1.js', 'utf8');
const css = fs.readFileSync('snippets/leave-workforce-v1.css', 'utf8');

assert.ok(html.includes('leave-workforce-v1.css?v=fix319'));
assert.ok(html.includes('leave-workforce-v1.js?v=fix319'));
assert.ok(html.includes('window._swGetState=function(){return SW_SEL;}'));
assert.ok(html.includes('window._lvwCanEditEmp?window._lvwCanEditEmp(e.empId)'));

[
  'เฉพาะของฉัน', 'เพิ่มวันหยุดหลายวัน',
  'Deadline', 'ว่างรับงาน', 'ประวัติการแก้ไข',
  'แก้ไขวันทำงานพิเศษ', 'คืนค่า'
].forEach(text => assert.ok(source.includes(text), `missing feature: ${text}`));

assert.ok(source.includes("function isManager(){return role()==='sup'||role()==='spec'}"));
assert.ok(source.includes('return isManager()||id===ownEmpId()'));
assert.ok(source.includes("if(!isManager()&&id!==ownEmpId())"));
assert.ok(source.includes("if(!isManager()&&empId!==ownEmpId())"));
assert.ok(source.includes('function saveSpecialRows(rows)'));
assert.ok(source.includes('function openSpecialEdit(id,dateKey)'));
assert.ok(source.includes('function deleteSpecial(id,y,m,d)'));
assert.ok(source.includes("ch.setAttribute('data-type',row.type||'')"));
assert.ok(source.includes("fbSet('/specialwork',rows)"));
assert.ok(source.includes("fbGet('/specialwork'"));
assert.ok(source.includes("fbSet('/leave_history'"));
assert.ok(source.includes('lvValidate(id,r.y,r.m,r.d,type'));
assert.ok(source.includes('disabled>ยืนยันบันทึก'));

assert.ok(!source.includes('id="lvw-outlook"'));
assert.ok(!source.includes('id="lvw-f-short"'));
assert.ok(css.includes('.lvw-day-panel'));
assert.ok(css.includes('.lvw-row-actions'));
assert.ok(css.includes('.lvw-calendar-stage'));
assert.ok(css.includes('grid-template-columns:minmax(0,2.15fr) minmax(300px,.85fr)'));
assert.ok(css.includes('.lvw-accordion'));
assert.ok(css.includes('.lvw-special-grid'));
assert.ok(css.includes('#tab-schedule .lv-sw-wrap{display:none!important}'));
assert.ok(css.includes('grid-auto-rows:minmax(72px'));
assert.ok(source.includes('function openSpecialAdd(cat,dateKey)'));
assert.ok(source.includes('3. วันทำงานพิเศษ'));
assert.ok(css.includes('.lvw-summary-grid'));
assert.ok(css.includes('Keep the monthly calendar in its original light palette'));
assert.ok(css.includes('restore the original light dashboard palette across'));
assert.ok(source.includes('ปฏิทินกำลังคนและวันหยุดทีม'));
assert.ok(source.includes('function renderTodaySummary()'));
assert.ok(source.includes("var VERSION='1.8.0'"));
assert.ok(source.includes("if(typeof window.lvOpenDay==='function'){window.lvOpenDay(y,m,d)"));
assert.ok(source.includes('function enhanceCombinedDay(y,m,d)'));
assert.ok(source.includes('function saveCombinedLeave(p)'));
assert.ok(source.includes('บันทึกวันทำงานพิเศษ'));
assert.ok(css.includes('.lvw-combined-tabs'));
assert.ok(css.includes('.lvw-day-panel{display:none!important}'));
assert.ok(source.includes("ribbons.className='lvw-special-ribbons'"));
assert.ok(source.includes("div.className='lvw-special-ribbon lvw-special-ribbon-'+key"));
assert.ok(source.includes("div.innerHTML='<b>'+specialRibbonLabel(x,cfg)+'</b>'"));
assert.ok(source.includes("cell.insertBefore(ribbons,num||chips)"));
assert.ok(!source.includes("cfg.label+' · '+esc(e?e.name"));
assert.ok(html.includes("entries.length>=2&&entries.length<=4?' lv-chips-grid2'"));
assert.ok(!source.includes("badges.innerHTML+='<span class=\"lv-job-badge\">Deadline "));
assert.ok(!source.includes("badges.innerHTML+='<span class=\"lv-job-badge short\">กำลังคนไม่พอ"));
assert.ok(css.includes('special-work ribbon, approved option 2'));
assert.ok(css.includes('approved employee grid and compact activity bars'));
assert.ok(css.includes('grid-auto-rows:minmax(98px,auto)!important'));
assert.ok(css.includes('.lvw-special-ribbon-outing{justify-content:center}'));
assert.ok(css.includes('.lv-emp-name{display:block;max-width:48px!important;overflow:visible!important'));
assert.ok(css.includes('border-bottom:0!important'));
assert.ok(css.includes('keep the original selected-date title and use one clear close action'));
assert.ok(css.includes('#lv-modal .lv-mtitle{color:#fff!important'));
assert.ok(css.includes('#lv-modal .lv-mhead>button:not(.lv-mclose){display:none!important}'));
assert.ok(css.includes('#lv-modal .lv-mclose-icon path{fill:none!important;stroke:#ff737b!important'));
assert.ok(html.includes('class="lv-mclose-icon"'));
assert.ok(html.includes('aria-label="ปิด"'));
assert.ok(html.includes("document.getElementById('lv-mtitle').textContent='📅 วัน'+dayName"));
assert.ok(html.includes("document.getElementById('lv-mcycle').textContent='รอบ: 26 '"));
assert.ok(!html.includes('<div class="lv-add-title">➕ เพิ่มการลา</div>'));
assert.ok(html.includes('lvRenderCal();lvRenderSum();lvRefreshEList();'));
assert.ok(html.includes("window.rbLeaveFinishSave({button:button||document.querySelector('#lv-elist .lv-esave'),close:lvCloseModal})"));
assert.ok(source.includes('window.lvSaveRow=function(uid,button)'));
assert.ok(source.includes("logHistory('special-add',dates.join(','),null,entry,entry.note);closeModal();"));
assert.ok(source.includes("window.rbLeaveFinishSave({button:button,promise:saved,close:lvCloseModal})"));
assert.ok(source.includes("window.rbLeaveFinishSave({button:button,close:lvCloseModal})"));
assert.ok(css.includes('html[data-theme="dark"]'));
assert.ok(css.includes('@media(max-width:600px)'));

console.log('leave-workforce-v1: integration checks passed');
