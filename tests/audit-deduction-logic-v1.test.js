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
console.log('audit deduction logic: passed');
