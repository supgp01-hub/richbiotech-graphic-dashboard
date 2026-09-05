const fs=require('fs');
const assert=require('assert');
const vm=require('vm');
const source=fs.readFileSync('index.html','utf8');
const guard=fs.readFileSync('snippets/order-delete-tombstone-v1.js','utf8');

assert(source.includes('snippets/order-delete-tombstone-v1.js?v=fix345'),'the deletion guard must load before order sync');
assert(guard.includes("KEY='rb_order_delete_guard_v1'"),'deleted orders need a durable local guard');
assert(guard.includes("src._deleted===true||deleted[key]"),'cloud tombstones and local guards must be excluded from order lists');
assert(guard.includes("op.method==='DELETE'||(op.data&&op.data._deleted===true)"),'queued tombstones must hide the order before the network confirms');
assert(source.includes("fbQueueOrderOp('PUT',old._fbKey,window.rbOrderDeletion.mark(old,curUser()))"),'deletion must create a server-side tombstone instead of an unsafe hard delete');
assert(source.includes("!everSynced&&!window.rbOrderDeletion.hasCloudMark(data)"),'a new browser must never migrate stale local work over a cloud tombstone');
assert(guard.includes("status('waiting','ลบแล้ว · รอซิงก์'"),'slow deletion must show an honest pending state');
assert(guard.includes("status('saved','ลบงานแล้ว'"),'confirmed deletion must show a success state');

const values={};
const localStorage={getItem:key=>Object.prototype.hasOwnProperty.call(values,key)?values[key]:null,setItem:(key,value)=>{values[key]=String(value)}};
const window={localStorage};
vm.runInNewContext(guard,{window,localStorage,Date,Promise,Object,JSON,String,Number});
const api=window.rbOrderDeletion;
const tombstone=api.mark({_fbKey:'order_GR090',id:'GR090'},'View');
assert.equal(tombstone._deleted,true,'a delete must produce a cloud tombstone');
assert.deepEqual(Array.from(api.rows({order_GR090:{id:'GR090',name:'ข้อมูลเก่า'},order_GR091:{id:'GR091',name:'งานที่ต้องอยู่'}}),row=>row.id),['GR091'],'a delayed old response must not resurrect the deleted order');
assert.deepEqual(Array.from(api.rows({order_GR090:tombstone,order_GR091:{id:'GR091'}}),row=>row.id),['GR091'],'a new browser must hide cloud tombstones');
assert.deepEqual(Array.from(api.merge([{_fbKey:'order_GR090',id:'GR090'},{_fbKey:'order_GR091',id:'GR091'}],[{path:'/orders/order_GR090',method:'PUT',data:tombstone}]),row=>row.id),['GR091'],'a queued delete must disappear before the network confirms');

console.log('order-delete-tombstone-v1: stale cloud snapshots cannot resurrect deleted orders');
