const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const window={
  addEventListener(){},
  lpORD(){return window._orders||[];},
  _rbUser:{name:'Supervisor',role:'sup'}
};
const document={
  documentElement:{},body:{appendChild(){}},
  querySelector(){return null;},querySelectorAll(){return[];},
  createElement(){return{remove(){},dataset:{}};}
};
const storage={};
const localStorage={getItem(k){return storage[k]||null;},setItem(k,v){storage[k]=String(v);}};
class MutationObserver{observe(){}}
const context={window,document,localStorage,MutationObserver,Date,Math,JSON,Object,Array,String,Number,Promise,Error,RegExp,isNaN,setTimeout(){},fetch(){throw Error('not used');},prompt(){return'';}};
vm.runInNewContext(fs.readFileSync('snippets/audit-deduction-center-v1.js','utf8'),context);
const api=window._rbAuditDeductionTest;

assert.equal(api.view(),'supervisor','Supervisor must start in a team-wide view');
window._rbUser={name:'Specialist',role:'spec'};
assert.equal(api.view(),'supervisor','Specialist must see the team-wide overview');
assert.equal(api.manage(),false,'Specialist visibility must remain read-only');
window._rbUser={name:'Audit',role:'audit'};
assert.equal(api.view(),'audit','Audit must see the team audit queue');
window._rbUser={name:'BALL',role:'graphic'};
assert.equal(api.view(),'staff','employees must stay in their own-item view');
assert.equal(api.manage(),false,'employees must not receive audit controls');
assert.equal(api.canEditList({employee:'BALL',listKey:'account-1'}),true,'employees may edit their own flagged Facebook account');
assert.equal(api.canEditList({employee:'DOM',listKey:'account-2'}),false,'employees must not edit another employee account from audit');
window._rbUser={name:'Specialist',role:'spec'};
assert.equal(api.canEditList({employee:'DOM',listKey:'account-2'}),true,'Specialist may edit team Facebook audit items');
window._rbUser={name:'Supervisor',role:'sup'};

const detected=new Date(2026,7,10,9).getTime();
window._orders=[
  {id:'GR100',_fbKey:'a',assignee:'BALL',name:'งานเดียวหลายเวอร์ชัน',status:'revision',auditVersions:[
    {version:1,result:'issue',correctionRequestedAt:detected,note:'ข้อความผิด'},
    {version:2,result:'issue',correctionRequestedAt:detected+1000,note:'สีผิด'}
  ]},
  {id:'GR101',_fbKey:'b',assignee:'BALL',name:'อีกงานในวันเดียวกัน',status:'revision',auditVersions:[
    {version:1,result:'issue',correctionRequestedAt:detected,note:'ขนาดผิด'}
  ]}
];
const items=api.detectOrders(new Date(2026,7,20).getTime());
assert.equal(items.length,2,'one order must create one item even when several versions are wrong');
assert.equal(items[0].versionCount,2);
assert.deepEqual(Array.from(items[0].versions),[1,2]);
assert.equal(api.chargeId(items[0]),api.chargeId(items[1]),'same employee and detected date must share one daily charge');
const totals=api.sumRows(items);
assert.equal(totals.pending,50,'several unfixed jobs on the same day must be capped at ฿50');

const august=['04/08/2569','ส.ค. 2569','DOM','ไม่เคลียร์ตารางสรุปแอด','04/08/2569','04/08/2569','','04/08/2569','หักเงินแล้ว','1','50','https://example.com/evidence','หมายเหตุ'];
const importedA=api.sheetRowToItem(august),importedB=api.sheetRowToItem(august.slice());
assert.equal(importedA.period,'2026-08');
assert.equal(importedA.amount,50);
assert.equal(importedA.id,importedB.id,'the same sheet row must keep a stable id for deduplication');

const csv='"วันที่","หัวข้อ"\n"04/08/2569","ข้อความ, มีจุลภาค"\n';
assert.equal(api.parseCsv(csv)[1][1],'ข้อความ, มีจุลภาค');

window._listfbData=[{_key:'safe-account',emp:'BALL',name:'Safe account',st:'ใช้งาน',upd:'07/09/2569'}];
assert.equal(api.detectList(new Date(2026,8,7).getTime()).length,0,'a corrected safe account must leave the deduction queue after recheck');
const followNow=new Date(2026,8,7,10).getTime();
assert.equal(api.auditRecommendedNextDate('รหัส 2FA ผิด','2026-08-30',followNow),'2026-09-14','audit must replace a past follow-up date with seven days after the save');
assert.equal(api.auditRecommendedNextDate('รหัส 2FA ผิด','2026-09-20',followNow),'2026-09-20','audit must preserve a manually selected future date');
assert.equal(api.auditRecommendedNextDate('ใช้งาน','2026-09-20',followNow),'','audit must clear the date after the account becomes safe');
localStorage.setItem('rb_listfacebook_followups_v1',JSON.stringify({'edited-account':{stage:'working',nextDate:'2026-08-31',updatedAt:new Date(2026,7,31).getTime()}}));
window._listfbData=[{_key:'edited-account',emp:'BALL',name:'Edited account',st:'Facebook โดนยืนยันสแกนหน้า',upd:'07/09/2569 14:25:06',updatedAt:followNow}];
assert.equal(api.listFollowupDue(window._listfbData[0],JSON.parse(localStorage.getItem('rb_listfacebook_followups_v1'))['edited-account'],followNow).toLocaleDateString('en-CA'),'2026-08-31','an unrelated account edit must not postpone the saved appointment');
assert.equal(api.detectList(new Date(2026,8,7,15).getTime()).length,1,'an unresolved saved appointment must remain in the audit queue');
assert.equal(api.detectList(new Date(2026,8,15,9).getTime()).length,1,'an unresolved problem status may return only after its new follow-up date');
console.log('audit deduction logic: passed');

window._orders=[{id:'deadline-new',assignee:'TER',deadline:'2026-09-11',status:'pending'}];
assert.equal(api.detectOrders(new Date(2026,8,11,23,59,59).getTime()).filter(x=>x.autoDeadlineCharge).length,0);
let charges=api.detectOrders(new Date(2026,8,12,0,0,1).getTime()).filter(x=>x.autoDeadlineCharge);
assert.equal(charges.length,1);assert.equal(charges[0].amount,10);assert.equal(api.status(charges[0],Date.now()),'confirmed');
window._orders[0].deadline='2026-09-12';
assert.equal(api.detectOrders(new Date(2026,8,14,23,59,59).getTime()).filter(x=>x.autoDeadlineCharge).length,0);
assert.equal(api.detectOrders(new Date(2026,8,15,0,0,1).getTime()).filter(x=>x.autoDeadlineCharge).length,1);
window._orders[0].status='review';
assert.equal(api.detectOrders(new Date(2026,8,15).getTime()).filter(x=>x.autoDeadlineCharge).length,0);
window._orders[0].status='pending';window._orders[0].deadline='2026-09-10';
assert.equal(api.detectOrders(new Date(2026,8,15).getTime()).filter(x=>x.autoDeadlineCharge).length,0);
console.log('deadline rule: midnight, weekend grace, submitted work and effective date passed');

window._orders=[{id:'late-offline',assignee:'TER',deadline:'2026-09-11',status:'done',firstSubmittedAt:new Date(2026,8,12,9).getTime()}];
assert.equal(api.detectOrders(new Date(2026,8,15).getTime()).filter(x=>x.autoDeadlineCharge).length,1,'late submission must be detected even after completion');
window._orders[0].firstSubmittedAt=new Date(2026,8,11,17).getTime();
assert.equal(api.detectOrders(new Date(2026,8,15).getTime()).filter(x=>x.autoDeadlineCharge).length,0,'on-time submission must not be charged');
