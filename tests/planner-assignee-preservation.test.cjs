const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
let orders=[],writes=[],next=1;
const w={_rbUser:{role:'sup',name:'View'},addEventListener(){},lvGetDay(){return [];},lpORD(){return orders;},spORD(value){orders=value;return Promise.resolve({ok:true,online:true});},fbSet(path,data){writes.push({path,data});return Promise.resolve(true);},rbReserveOrderId(){return Promise.resolve('TEST'+next++);}};
const storage={};const ctx={window:w,document:{readyState:'loading',addEventListener(){}},localStorage:{getItem(k){return storage[k]||null;},setItem(k,v){storage[k]=v;}},console,setTimeout(){},clearTimeout(){},setInterval(){}};
vm.runInNewContext(fs.readFileSync('snippets/order-planner-v1.js','utf8'),ctx);const api=w._rbOrderPlannerTest;
const base={name:'Test graphic',product:'Test',type:'กราฟิก',deadline:'2026-09-14',scheduledDate:'2026-09-14',repeat:'none'};
(async()=>{
for(const assignee of ['DOM','JAM']){const result=await api.dispatchDraft({...base,id:'draft-'+assignee,assignee},{absencePolicy:'reassign',recurring:false},true,orders);assert(result.ok);assert.equal(result.order.assignee,assignee);assert.equal(result.draft.finalAssignee,assignee);}
const count=orders.length;
let result=await api.dispatchDraft({...base,id:'missing',assignee:''},{absencePolicy:'reassign'},true,orders);assert(!result.ok);assert.equal(orders.length,count);
w.lvGetDay=()=>[{empId:'jam'}];result=await api.dispatchDraft({...base,id:'away',assignee:'JAM'},{absencePolicy:'reassign'},true,orders);assert(!result.ok);assert.equal(result.draft.assignee,'JAM');assert.equal(orders.length,count);
assert(!orders.some(o=>o.assignee==='MOS'));console.log('PASS: DOM/JAM retained; missing or absent assignee never silently becomes MOS');})();
