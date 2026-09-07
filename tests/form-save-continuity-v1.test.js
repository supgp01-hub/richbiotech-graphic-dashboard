const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const block=(a,b)=>html.slice(html.indexOf(a),html.indexOf(b,html.indexOf(a)));
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('ID card failed save keeps draft; retry updates same row; concurrent typing survives',async()=>{
 let rows=[],resolveSave,closed=0;
 const c={window:{},_icDraftRows:[{employee:'TEST',phase:'First'}],icLoad:()=>JSON.parse(JSON.stringify(rows)),icSave:a=>{rows=JSON.parse(JSON.stringify(a));return new Promise(r=>resolveSave=r);},icRender:()=>{},Promise,Date,Math};
 c.window._icCancelAdd=()=>{closed++;c._icDraftRows=[];};
 vm.createContext(c);vm.runInContext(block('window._icSaveAllDrafts=function(){',';})();</script>'),c);
 let pending=c.window._icSaveAllDrafts();await tick();assert.equal(closed,0);resolveSave(false);assert.equal(await pending,false);assert.equal(closed,0);assert.equal(rows.length,1);
 const id=rows[0].id;pending=c.window._icSaveAllDrafts();await tick();c._icDraftRows[0].phase='Typed during save';resolveSave(true);await pending;assert.equal(closed,0);assert.equal(rows.length,1);assert.equal(rows[0].id,id);
 pending=c.window._icSaveAllDrafts();await tick();resolveSave(true);await pending;assert.equal(closed,1);assert.equal(rows[0].phase,'Typed during save');
});
test('ID card saving waits for photo preparation and failed network leaves form',async()=>{
 const c={window:{},_icDraftRows:[{_photoPending:{}}],Promise};vm.createContext(c);vm.runInContext(block('window._icSaveAllDrafts=function(){',';})();</script>'),c);
 await assert.rejects(c.window._icSaveAllDrafts(),/กำลังเตรียมรูป/);
});
test('confirmed order survives stale snapshots while newer remote and tombstones win',()=>{
 const local=[{id:'GR_TEST',_fbKey:'test',name:'New',updatedAt:20}];
 const c={_fbRecentOrderWrites:{test:{ts:Date.now(),data:{name:'New',updatedAt:20}}},lpORD:()=>local,fbOrdersFromData:d=>Object.entries(d).filter(([,r])=>!r._deleted).map(([k,r])=>({...r,_fbKey:k})),fbMergePendingOrders:r=>r,fbOrderHasAssetFields:()=>false,FB_ORDER_ASSET_FIELDS:[],Date};
 vm.createContext(c);vm.runInContext(block('function fbMergeRemoteSnapshot(data){','function fbApplyRemoteOrders(data){'),c);
 const other={other:{id:'OTHER'}};
 assert.equal(c.fbMergeRemoteSnapshot(other).find(r=>r._fbKey==='test').name,'New');
 assert.equal(c.fbMergeRemoteSnapshot({...other,test:{id:'GR_TEST',name:'Old',updatedAt:10}}).find(r=>r._fbKey==='test').name,'New');
 assert.equal(c.fbMergeRemoteSnapshot({...other,test:{id:'GR_TEST',name:'Colleague',updatedAt:30}}).find(r=>r._fbKey==='test').name,'Colleague');
 assert.equal(c.fbMergeRemoteSnapshot({...other,test:{id:'GR_TEST',_deleted:true,updatedAt:30}}).some(r=>r._fbKey==='test'),false);
});
test('order form remains open for queued save and changed input, closes only unchanged online save',async()=>{
 let signature='a',closed=0,finish;
 const c={_omActionBusy:false,_omUploadPending:0,_omAssetsReady:true,omPendingSignature:()=>signature,setOMActionBusy:b=>c._omActionBusy=b,setOMSubmitFeedback:()=>{},spORD:()=>new Promise(r=>finish=r),window:{},closeOM2:()=>closed++,Promise,console};
 vm.createContext(c);vm.runInContext(block('  function persistOMAndFinish(orders,options){','  var OM_DRAFT_FIELDS='),c);
 let p=c.persistOMAndFinish([]);finish({ok:true,online:false});await p;assert.equal(closed,0);
 p=c.persistOMAndFinish([]);signature='b';finish({ok:true,online:true});await p;assert.equal(closed,0);
 p=c.persistOMAndFinish([]);finish({ok:true,online:true});await p;assert.equal(closed,1);
});
test('in-flight queue token is immutable when a second edit is coalesced in memory',async()=>{
 let finish;const c={_fbRecentOrderWrites:{},_fbOrderMemoryQueue:[],localStorage:{getItem:()=>null},window:{rbDurableOrderQueue:{persist(q,k,cb){cb(q);return{durable:true};}}},FB_ORDER_QUEUE:'test',_fbOrderFlushActive:false,_fbOrderRetryTimer:null,_fbSse:null,FB_REQ_TIMEOUT:100,FB_DB:'test',navigator:{onLine:true},fbIsLeader:()=>true,fbSetSyncState:()=>{},fbFetch:()=>new Promise(r=>finish=r),Promise,Date,Math,JSON,setTimeout,clearTimeout};
 vm.createContext(c);vm.runInContext(block('function fbOrderQueueLoad(){','function fbScheduleStreamRefresh(){'),c);
 const first=c.fbQueueOrderOp('PATCH','test',{name:'one'});const second=c.fbQueueOrderOp('PATCH','test',{name:'two'});finish();await tick();
 assert.notEqual(first.token,second.token);assert.equal(c._fbOrderMemoryQueue.length,1);assert.equal(c._fbOrderMemoryQueue[0].data.name,'two');finish();await tick();assert.equal(c._fbOrderMemoryQueue.length,0);
});
