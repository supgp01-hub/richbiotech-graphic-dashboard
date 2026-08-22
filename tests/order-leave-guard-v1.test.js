const assert=require('assert');
const fs=require('fs');
const vm=require('vm');
const source=fs.readFileSync('snippets/order-leave-guard-v1.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const data={
  '2026-8-22':[{empId:'nun',type:'hol'}],
  '2026-8-25':[{empId:'mos',type:'vac'}],
  '2026-8-26':[{empId:'dom',type:'sick'}]
};
const dom={
  'om-mb':{value:'NUNE',style:{}},
  'om-dl':{value:'2026-08-24',style:{}},
  'om-leave-guard':{className:'',innerHTML:''}
};
const context={window:null,LV_DATA:data,localStorage:{getItem(){return null;}},document:{getElementById(id){return dom[id]||null;},addEventListener(){}},addEventListener(){},Date};context.window=context;
vm.runInNewContext(source,context);
const api=context._rbOrderLeaveGuardTest;
assert.ok(api,'leave guard API must be available');
let result=api.validate({assignee:'NUNE',deadline:'2026-08-24',now:new Date(2026,7,22,9),data,enforce:true});
assert.strictEqual(result.block,true,'new work must be blocked when Nune is off today');
assert.strictEqual(result.offToday,true,'today conflict must be identified');
result=api.validate({assignee:'MOS',deadline:'2026-08-25',now:new Date(2026,7,22,9),data,enforce:true});
assert.strictEqual(result.block,true,'assignment must be blocked when Moss is off on the deadline');
assert.strictEqual(result.offDeadline,true,'deadline conflict must be identified');
result=api.validate({assignee:'TER',deadline:'2026-08-25',now:new Date(2026,7,22,9),data,enforce:true});
assert.strictEqual(result.block,false,'working employees must remain assignable');
result=api.validate({assignee:'DOM',deadline:'2026-08-26',now:new Date(2026,7,22,9),data,enforce:false});
assert.strictEqual(result.block,false,'an unchanged existing assignment must remain editable');
assert.strictEqual(result.conflicts.length,1,'existing assignments must still display their leave warning');
dom['om-mb'].value='MOS';
dom['om-dl'].value='2026-08-25';
context.rbRefreshOrderLeaveGuard();
assert.strictEqual(dom['om-leave-guard'].className,'rb-order-leave-guard is-blocked','the order modal must show a blocked warning');
assert.ok(dom['om-leave-guard'].innerHTML.includes('Moss')&&dom['om-leave-guard'].innerHTML.includes('ไม่สามารถมอบหมายงาน'),'the warning must identify the unavailable employee');
assert.strictEqual(dom['om-mb'].style.borderColor,'#ef4444','the unavailable assignee field must be highlighted');
dom['om-mb'].value='TER';
context.rbRefreshOrderLeaveGuard();
assert.strictEqual(dom['om-leave-guard'].className,'rb-order-leave-guard is-available','changing to an available employee must clear the warning');
assert.strictEqual(dom['om-mb'].style.borderColor,'','the assignee field highlight must reset after choosing an available employee');
assert.ok(index.includes("rbValidateOrderLeaveAssignment({assignee:guardAssignee"),'order save must enforce the leave guard before persistence');
assert.ok(index.includes("id='om-leave-guard'")||index.includes("leaveGuard.id='om-leave-guard'"),'order modal must display the live leave status');
assert.ok(index.includes('order-leave-guard-v1.js?v=226')&&index.includes('order-leave-guard-v1.css?v=226'),'deployed page must load the cache-busted leave guard assets');
assert.ok(index.includes('<meta name="rb-build" content="fix226">'),'deployed page must expose build fix226');
console.log('order-leave-guard-v1: all tests passed');
