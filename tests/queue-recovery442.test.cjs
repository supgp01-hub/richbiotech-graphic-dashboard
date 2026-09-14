const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const values={};const storage={getItem:k=>values[k]||null,setItem:(k,v)=>values[k]=v};
const ctx={window:{localStorage:storage},localStorage:storage,document:{addEventListener(){}},Date,Promise};vm.createContext(ctx);
vm.runInContext(fs.readFileSync('snippets/order-durable-queue-v1.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('snippets/order-conflict-review-v1.js','utf8'),ctx);
const q=ctx.window.rbDurableOrderQueue,r=ctx.window.rbOrderConflictReview;
(async()=>{
const a={path:'/orders/a',token:'ack',ts:1},b={path:'/orders/a',token:'new',ts:2};
q.rememberRemoved('order_write_queue_v1',[a,b],[b]);
assert.deepEqual(JSON.parse(JSON.stringify(await q.restore([a,b]))),[b]);
const c={...b,token:'conflict',ts:3};assert.equal((await q.restore([b,c])).length,2);
for(const [id,assignee] of [['1789296847585_x39t0','DOM'],['1789297141225_bntkh','JAM']]){
 const op={path:'/orders/planner_draft_'+id,token:id,ts:1789362517000,conflict:true,data:{assignee:'MOS',status:'pending',brief:'original'}};
 const remote={assignee,status:'review',brief:'original'};
 assert(r.repairConfirmedAssignment(op,remote));
 assert(!r.repairConfirmedAssignment({...op,data:{...op.data,brief:'new content'}},remote));
 assert(!r.repairConfirmedAssignment({...op,ts:1789362518000},remote));
 assert(!r.repairConfirmedAssignment(op,{...remote,assignee:'OTHER'}));
}
assert.equal(JSON.parse(values.rb_order_conflict_archive_v1).length,2);
storage.setItem=()=>{throw Error('full')};
assert(!r.repairConfirmedAssignment({path:'/orders/planner_draft_1789297141225_bntkh',token:'unarchived',ts:1,conflict:true,data:{status:'pending'}},{assignee:'JAM'}));
console.log('PASS: retired queues stay retired; distinct same-job edits survive; scoped repair archives and preserves new content');
})().catch(e=>{console.error(e);process.exitCode=1});
