const vm=require('vm'),fs=require('fs'),assert=require('node:assert/strict');
const copy=x=>JSON.parse(JSON.stringify(x));
const initial={id:'QA',assignee:'JAM',brief:'current supervisor brief',status:'inprogress',updatedAt:100,_syncRevision:1};
const operation={token:'submit1',path:'/orders/work',method:'PATCH',conflict:true,data:{status:'review',brief:'old employee brief',submitLinks:['https://example.test/1','https://example.test/2'],submitLink:'https://example.test/1',auditVersions:[{version:1,workLink:'https://example.test/1'}],firstSubmittedAt:50,firstSubmittedBy:'Jam'}};
const record={_ownerUid:'jam',operation,online:copy(initial)};
let remote,receipt,queue,writes,failReceipt,race,deny,refresh=0;
const w={_rbUser:{role:'sup',uid:'view'},fbRefreshOrders:()=>{refresh++},fbOrderQueueLoad:()=>queue,fbOrderQueueSave:q=>{queue=q},rbFirebaseAuth:{fetch:async(url,o={})=>{
 const order=url.includes('/orders/'),read=!o.method||o.method==='GET';
 if(deny)throw new Error('offline');
 if(read)return new Response(JSON.stringify(order?remote:url.endsWith('/jam.json')?{submit1:receipt}:receipt),{headers:{ETag:'"'+remote._syncRevision+'"'}});
 if(order){if(race){remote.status='done';remote._syncRevision++;race=false;}if(o.headers['if-match']!=='"'+remote._syncRevision+'"')return new Response('',{status:412});remote=JSON.parse(o.body);writes++;return new Response('{}');}
 const data=JSON.parse(o.body);if(failReceipt&&data.state==='committed'){failReceipt=false;return new Response('{}',{status:503});}receipt=data;return new Response('{}');
}}};
const c={window:w,Response,AbortController,setTimeout,clearTimeout};vm.createContext(c);['safe-order-write-v1.js','order-conflict-recovery-v1.js'].forEach(f=>vm.runInContext(fs.readFileSync('snippets/'+f,'utf8'),c));const api=w.rbOrderConflictRecovery;
function reset(){remote=copy(initial);receipt=null;queue=[copy(operation)];writes=0;failReceipt=false;race=false;deny=false;w._rbUser={role:'sup',uid:'view'};}
(async()=>{
 reset();let p=await api.inspect(record);assert.equal(p.plan.patch.status,'review');assert(!('brief' in p.plan.patch));assert(p.plan.kept.includes('brief'));
 await api.commit(p);assert.equal(remote.brief,initial.brief);assert.equal(remote.status,'review');assert.equal(remote.submitLinks.length,2);assert.equal(remote.firstSubmittedAt,50);assert.equal(receipt.before.status,'inprogress');assert.equal(receipt.operation.data.brief,'old employee brief');assert.equal(receipt.state,'committed');
 await api.commit(p);assert.equal(writes,1,'repeat click cannot duplicate the server write');
 w._rbUser={role:'graphic',uid:'other'};await api.consume();assert.equal(queue.length,1,'other users cannot consume JAM receipt');w._rbUser={role:'graphic',uid:'jam'};queue[0].data.submitLink='newer work';await api.consume();assert.equal(queue.length,1,'changed queued data cannot be discarded');queue=[copy(operation)];await api.consume();assert.equal(queue.length,0,'exact acknowledged operation is retired');
 reset();p=await api.inspect(record);remote.brief='another supervisor edit';await assert.rejects(api.commit(p),/เปลี่ยน/);assert.equal(writes,0);
 reset();p=await api.inspect(record);race=true;await assert.rejects(api.commit(p),/เปลี่ยน/);assert.equal(remote.status,'done');assert.equal(receipt.state,'prepared');w._rbUser={role:'graphic',uid:'jam'};await api.consume();assert.equal(queue.length,1,'prepared receipt cannot clear queue');
 reset();p=await api.inspect(record);failReceipt=true;await assert.rejects(api.commit(p),/503/);assert.equal(remote.status,'review');assert.equal(receipt.state,'prepared');await api.commit(p);assert.equal(writes,1,'retry after partial success only completes receipt');assert.equal(receipt.state,'committed');
 reset();p=await api.inspect(record);deny=true;await assert.rejects(api.commit(p),/offline/);assert.equal(writes,0);assert.equal(queue.length,1);
 reset();remote.status='done';p=api.plan(record,remote);assert(!('status' in p.patch));assert(!('auditVersions' in p.patch));remote.status='revision';p=api.plan(record,remote);assert(!('status' in p.patch));
 remote._deleted=true;assert.throws(()=>api.plan(record,remote),/ถูกลบ/);delete remote._deleted;remote.assignee='DOM';assert.throws(()=>api.plan(record,remote),/ผู้รับผิดชอบ/);
 w._rbUser={role:'graphic',uid:'jam'};await assert.rejects(api.inspect(record),/เฉพาะหัวหน้า/);
 await assert.rejects(w.rbSafeOrderWrite.write('https://example.test/orders/work.json',{method:'PUT',body:JSON.stringify({...initial,status:'review',updatedAt:200}),rbBaseUpdatedAt:100,rbExpectedRecord:initial},async()=>new Response(JSON.stringify({...initial,brief:'changed without timestamp'}),{headers:{ETag:'"2"'}})),/เปลี่ยน/,'complete preview snapshot must remain unchanged even if a legacy client omitted the timestamp');
 console.log('PASS central submission recovery: additive fields, preserved brief, ETag races, offline, partial receipt retry, idempotence, exact queue receipt and role/account boundaries');
})().catch(e=>{console.error(e);process.exitCode=1});
