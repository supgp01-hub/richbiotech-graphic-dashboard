const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('index.html', 'utf8');
const source = fs.readFileSync('snippets/leave-workforce-v1.js', 'utf8');
const css = fs.readFileSync('snippets/leave-workforce-v1.css', 'utf8');

assert.ok(html.includes('leave-workforce-v1.css?v=253'));
assert.ok(html.includes('leave-workforce-v1.js?v=253'));
assert.ok(html.includes('window._swGetState=function(){return SW_SEL;}'));
assert.ok(html.includes('window._lvwCanEditEmp?window._lvwCanEditEmp(e.empId)'));

[
  '14 วันข้างหน้า', 'เฉพาะของฉัน', 'กำลังคนไม่พอ', 'เพิ่มวันหยุดหลายวัน',
  'Deadline', 'งานรอตรวจ', 'ว่างรับงาน', 'ประวัติการแก้ไข',
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

assert.ok(css.includes('.lvw-outlook-grid'));
assert.ok(css.includes('.lvw-day-panel'));
assert.ok(css.includes('.lvw-row-actions'));
assert.ok(css.includes('.lvw-calendar-stage'));
assert.ok(css.includes('.lvw-summary-grid'));
assert.ok(source.includes('ปฏิทินกำลังคนและวันหยุดทีม'));
assert.ok(source.includes('function renderTodaySummary()'));
assert.ok(css.includes('html[data-theme="dark"]'));
assert.ok(css.includes('@media(max-width:600px)'));

console.log('leave-workforce-v1: integration checks passed');
