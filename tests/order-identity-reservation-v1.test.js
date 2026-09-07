const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const html=fs.readFileSync('index.html','utf8');
const planner=fs.readFileSync('snippets/order-planner-v1.js','utf8');
const ops=fs.readFileSync('snippets/workflow-ops-v1.js','utf8');

const helperStart=html.indexOf('function rbOrderRef(');
const helperEnd=html.indexOf('\nfunction rbOrderNumber(',helperStart);
const helperSource=html.slice(helperStart,helperEnd)+'\nthis.rbOrderRef=rbOrderRef;this.rbFindOrderIndex=rbFindOrderIndex;this.rbFindOrder=rbFindOrder;';
const sandbox={};sandbox.window=sandbox;
vm.runInNewContext(helperSource,sandbox);
const duplicateRows=[
  {_fbKey:'order-a',id:'GR153',name:'ยำคลิป',assignee:'BALL'},
  {_fbKey:'planner-draft-b',id:'GR153',name:'NEW โกดังสินค้า',assignee:'DOM'}
];
assert.equal(sandbox.rbFindOrder(duplicateRows,'planner-draft-b').name,'NEW โกดังสินค้า','an internal order key must open the exact duplicate row');
assert.equal(sandbox.rbFindOrderIndex(duplicateRows,'GR153'),-1,'an ambiguous visible GR number must never guess which row to edit');
assert.equal(sandbox.rbFindOrder(duplicateRows,'order-a').assignee,'BALL','the first duplicate must remain independently addressable');

assert.ok(html.includes("headers:{'X-Firebase-ETag':'true'}"),'online order id allocation must read a Firebase ETag');
assert.ok(html.includes("'If-Match':state.etag"),'online order id allocation must atomically claim one number');
assert.ok(html.includes("eb.onclick=(function(orderRef)")&&html.includes("})(rbOrderRef(o));"),'the work table must open by collision-safe identity');
assert.ok(html.includes("db.onclick=(function(orderRef,id,ttl)")&&html.includes('delOrder(orderRef)'),'deleting one duplicate must target only that record');
assert.ok(html.includes("_OM2.setAttribute('data-order-key',_omEditingKey)"),'the detail modal must retain the exact internal order identity');
assert.ok(html.includes('var idx=modalOrderIndex(orders,ordId);'),'status actions must update the selected record rather than the first matching GR number');
assert.ok(html.includes('localIdCount[row.id]===1&&remoteIdCount[row.id]===1'),'a remote refresh must never merge cached fields across duplicated visible numbers');
assert.ok(planner.includes("function dispatchedOrderForDraft(d,orders)")&&planner.includes("order.sourceDraftId===d.id"),'planner dispatch must deduplicate by the exact source draft');
assert.ok(planner.includes("window.rbReserveOrderId(d.orderId||'')"),'planner and Add New must share the same online number allocator');
assert.ok(planner.includes("!order.sourceDraftId&&(order.id||order.orderId)===draft.orderId"),'legacy visible-id fallback must not associate a different planner job');
assert.ok(ops.includes('data-order="\'+esc(keyOf(o))'),'operations inbox must open the exact internal record');
assert.ok(ops.includes("ref=root.getAttribute('data-order-key')||id"),'workflow locks and validation must follow the selected internal record');

console.log('order-identity-reservation-v1: all tests passed');
