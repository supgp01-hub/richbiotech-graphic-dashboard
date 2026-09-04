const assert=require('assert');
const fs=require('fs');
const vm=require('vm');

const source=fs.readFileSync('snippets/persistence-reliability-v3.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const store=new Map();
const writes=[];
let online=false;
let getError=false;
let blockNext=false;
let releaseBlocked=null;
const localStorage={
  getItem:key=>store.has(key)?store.get(key):null,
  setItem:(key,value)=>store.set(key,String(value)),
  removeItem:key=>store.delete(key)
};
const document={
  documentElement:{setAttribute(name,value){this[name]=value;}},
  getElementById(){return null;}
};
const listeners={};
const window={
  document,localStorage,
  addEventListener(name,handler){listeners[name]=handler;},
  dispatchEvent(){},
  fbSet(path,data){writes.push({path,data});if(blockNext){blockNext=false;return new Promise(resolve=>{releaseBlocked=resolve;});}return Promise.resolve(online);},
  fbGet(path,callback){if(getError)callback(new Error('offline'),null);else callback(null,{remote:{value:'เก่า'},item:{value:'เก่า'}});}
};
const context={window,document,localStorage,navigator:{onLine:true},CustomEvent:function(name,options){this.type=name;this.detail=options.detail;},console,Date,JSON,Object,Array,String,Number,Math,Promise,setTimeout(){return 1;},clearTimeout(){}};
vm.createContext(context);
vm.runInContext(source,context);

(async function(){
  assert.strictEqual(window.rbPersistence.version,'3.3.2');
  assert.strictEqual(document.documentElement['data-persistence-reliability'],'3.3.2');

  const first=await window.fbSet('/module/item',{value:'ใหม่',updatedAt:20});
  assert.strictEqual(first,false,'a failed server write must not be reported as synced');
  assert.strictEqual(window.rbPersistence.pendingCount(),1,'a failed write must remain queued');

  let loaded;
  window.fbGet('/module',(error,data)=>{assert.ifError(error);loaded=data;});
  assert.deepStrictEqual(JSON.parse(JSON.stringify(loaded)),{remote:{value:'เก่า'},item:{value:'ใหม่',updatedAt:20}},'a stale refresh must preserve the queued local child value');

  getError=true;
  let unrelatedError=null;
  window.fbGet('/specialwork',(error)=>{unrelatedError=error;});
  assert.ok(unrelatedError,'a queued module write must not hide a network error from an unrelated module');
  getError=false;

  await window.fbSet('/whole',{kept:true});
  let whole;
  window.fbGet('/whole',(error,data)=>{assert.ifError(error);whole=data;});
  assert.deepStrictEqual(JSON.parse(JSON.stringify(whole)),{kept:true},'a queued parent snapshot must replace stale remote data');

  online=true;
  window.rbPersistence.flush();
  await new Promise(resolve=>setImmediate(resolve));
  await new Promise(resolve=>setImmediate(resolve));
  assert.strictEqual(window.rbPersistence.pendingCount(),0,'queued writes must clear after a confirmed retry');
  assert.ok(writes.length>=4,'both initial attempts and retries must reach the server adapter');

  store.set('rb_generic_write_queue_v3',JSON.stringify([{token:'legacy',path:'/order_planner/drafts',data:{draft_a:{id:'draft_a',name:'A'},draft_b:{id:'draft_b',name:'B'}},ts:10}]));
  assert.strictEqual(window.rbPersistence.migrateUnsafeCollectionWrites(),true,'legacy whole-planner writes must be migrated before retry');
  const migrated=window.rbPersistence.queue();
  assert.deepStrictEqual(migrated.map(x=>x.path).sort(),['/order_planner/drafts/draft_a','/order_planner/drafts/draft_b'],'legacy writes must become independent child writes');
  store.set('rb_generic_write_queue_v3','[]');

  store.set('rb_generic_write_queue_v3',JSON.stringify([{token:'legacy-idcards',path:'/workflow_snapshots/idcards_shared_v1',data:[{id:'ic_1',employee:'View'},{id:'ic_2',employee:'Moss'}],ts:15}]));
  assert.strictEqual(window.rbPersistence.migrateUnsafeCollectionWrites(),true,'legacy whole ID-card writes must be split before retry');
  assert.deepStrictEqual(window.rbPersistence.queue().map(x=>x.path).sort(),['/workflow_snapshots/idcards_shared_v1/ic_1','/workflow_snapshots/idcards_shared_v1/ic_2'],'ID-card photos must retry per employee');
  store.set('rb_generic_write_queue_v3','[]');

  store.set('rb_generic_write_queue_v3',JSON.stringify([{token:'denied-users',path:'/rb_users',data:[{name:'legacy'}],ts:30},{token:'keep-work',path:'/specialwork_v2/items/a',data:{id:'a'},ts:31}]));
  assert.strictEqual(window.rbPersistence.removeDeniedLegacyWrites(),true,'obsolete denied user writes must be removed from the business queue');
  assert.deepStrictEqual(window.rbPersistence.queue().map(x=>x.path),['/specialwork_v2/items/a'],'valid business writes must be preserved during cleanup');
  store.set('rb_generic_write_queue_v3','[]');

  store.set('rb_generic_write_queue_v3',JSON.stringify([{token:'legacy-orders',path:'/orders',data:[{id:'GR001',name:'A'},{id:'GR002',sourceDraftId:'draft_b',name:'B'}],ts:20}]));
  assert.strictEqual(window.rbPersistence.migrateUnsafeCollectionWrites(),true,'legacy whole-order writes must be migrated before retry');
  assert.deepStrictEqual(window.rbPersistence.queue().map(x=>x.path).sort(),['/orders/order_GR001','/orders/planner_draft_b'],'whole-order writes must become non-destructive independent child writes');
  store.set('rb_generic_write_queue_v3','[]');

  writes.length=0;
  const collectionSave=await window.fbSet('/orders',[{id:'GR003',name:'C'},{id:'GR004',sourceDraftId:'draft_d',name:'D'}]);
  assert.strictEqual(collectionSave,true,'legacy collection callers must still complete successfully');
  assert.deepStrictEqual(writes.map(x=>x.path).sort(),['/orders/order_GR003','/orders/planner_draft_d'],'a collection save must fan out and never overwrite /orders');

  blockNext=true;
  const rapidFirst=window.fbSet('/rapid',{value:1});
  await Promise.resolve();
  const writesBeforeSecond=writes.length;
  const rapidSecond=await window.fbSet('/rapid',{value:2});
  assert.strictEqual(rapidSecond,false,'a newer save on the same path must wait instead of racing the active write');
  assert.strictEqual(writes.length,writesBeforeSecond,'the newer same-path value must not be sent concurrently');
  releaseBlocked(true);
  await rapidFirst;
  window.rbPersistence.flush();
  await new Promise(resolve=>setImmediate(resolve));
  assert.strictEqual(writes[writes.length-1].data.value,2,'the newest same-path value must be the final server write');
  assert.strictEqual(window.rbPersistence.pendingCount(),0,'the serialized same-path queue must fully drain');
  assert.ok(index.indexOf('snippets/persistence-reliability-v3.js?v=fix340')<index.indexOf('snippets/leave-persistence-v2.js'),'the reliability wrapper must load before feature persistence modules');
  console.log('persistence-reliability-v3: all tests passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
