const assert=require('assert');
const fs=require('fs');
const vm=require('vm');
const source=fs.readFileSync('snippets/order-leave-guard-v1.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const data={
  '2026-8-22':[{empId:'nun',type:'hol'},{empId:'ter',type:'hol'}],
  '2026-8-25':[{empId:'mos',type:'vac'}],
  '2026-8-26':[{empId:'dom',type:'sick'}]
};
const dom={
  'om-mb':{value:'NUNE',style:{},disabled:false},
  'om-dl':{value:'2026-08-24',style:{}},
  'om-leave-guard':{className:'',innerHTML:''}
};
const context={window:null,LV_DATA:data,localStorage:{getItem(){return null;}},document:{getElementById(id){return dom[id]||null;},addEventListener(){}},addEventListener(){},Date};context.window=context;
vm.runInNewContext(source,context);
const api=context._rbOrderLeaveGuardTest;
assert.ok(api,'leave guard API must be available');
let result=api.validate({assignee:'NUNE',deadline:'2026-08-24',now:new Date(2026,7,22,9),data,enforce:true});
assert.strictEqual(result.block,false,'today leave must not block a different working deadline');
assert.strictEqual(result.offToday,false,'the guard must check the deadline only');
result=api.validate({assignee:'MOS',deadline:'2026-08-25',now:new Date(2026,7,22,9),data,enforce:true});
assert.strictEqual(result.block,true,'saving must pause when the deadline is an employee leave day');
assert.strictEqual(result.offDeadline,true,'deadline conflict must be identified');
result=api.validate({assignee:'TER',deadline:'2026-08-25',now:new Date(2026,7,22,9),data,enforce:true});
assert.strictEqual(result.block,false,'working deadlines must remain assignable');
result=api.validate({assignee:'TER',deadline:'2026-08-23',now:new Date(2026,7,22,9),data,enforce:true});
assert.strictEqual(result.block,false,'Ter may receive an order due on August 23 even when leave is on August 22');
result=api.validate({assignee:'TER',deadline:'2026-08-22',now:new Date(2026,7,22,9),data,enforce:true});
assert.strictEqual(result.block,true,'Ter must only be blocked when the deadline itself is August 22');
result=api.validate({assignee:'DOM',deadline:'2026-08-26',now:new Date(2026,7,22,9),data,enforce:false});
assert.strictEqual(result.block,false,'an unchanged existing assignment must remain editable');
assert.strictEqual(result.conflicts.length,1,'existing assignments must still display their deadline warning');
dom['om-mb'].value='MOS';
dom['om-dl'].value='2026-08-25';
context.rbRefreshOrderLeaveGuard();
assert.strictEqual(dom['om-leave-guard'].className,'rb-order-leave-guard is-blocked','the order modal must show a deadline warning');
assert.ok(dom['om-leave-guard'].innerHTML.includes('Moss')&&dom['om-leave-guard'].innerHTML.includes('กรุณาเปลี่ยนวันที่ Deadline ใหม่'),'the warning must identify the employee and tell the user to change the deadline');
assert.strictEqual(dom['om-dl'].style.borderColor,'#ef4444','only the conflicting deadline field must be highlighted');
assert.strictEqual(dom['om-mb'].style.borderColor,'','the assignee field must remain selectable and unhighlighted');
assert.strictEqual(dom['om-mb'].disabled,false,'the assignee dropdown must never be disabled by the guard');
dom['om-mb'].value='TER';
context.rbRefreshOrderLeaveGuard();
assert.strictEqual(dom['om-leave-guard'].className,'rb-order-leave-guard is-available','changing to an available employee must clear the warning');
assert.strictEqual(dom['om-dl'].style.borderColor,'','the deadline highlight must reset after the conflict is resolved');
assert.ok(index.includes("rbValidateOrderLeaveAssignment({assignee:guardAssignee"),'order save must validate the deadline before persistence');
assert.ok(index.includes("var guardDate=ge('om-dl')"),'a conflict must return focus to the deadline field, not the employee dropdown');
assert.ok(index.includes("id='om-leave-guard'")||index.includes("leaveGuard.id='om-leave-guard'"),'order modal must display the live deadline status');
assert.ok(index.includes('order-leave-guard-v1.js?v=230')&&index.includes('order-leave-guard-v1.css?v=230'),'deployed page must load the cache-busted deadline guard assets');
assert.ok(index.includes('<meta name="rb-build" content="fix361">'),'deployed page must expose the current build');
console.log('order-leave-guard-v1: all tests passed');
