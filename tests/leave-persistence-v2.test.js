const assert=require('assert');
const fs=require('fs');
const vm=require('vm');

const source=fs.readFileSync('snippets/leave-persistence-v2.js','utf8');
const store=new Map();
let remoteCallback=null;
let writes=[];
let pendingWriteResolve=null;
let autoResolve=false;
const localStorage={
  getItem:key=>store.has(key)?store.get(key):null,
  setItem:(key,value)=>store.set(key,String(value)),
  removeItem:key=>store.delete(key)
};
const document={visibilityState:'visible',documentElement:{setAttribute(){}}};
const window={
  LV_DATA:{},LV_UID:1,document,localStorage,
  lvDK:(y,m,d)=>`${y}-${m}-${d}`,
  lvSaveLS(){},lvSaveDay(){},lvRender(){},lvRestorePhotos(){},
  fbGet(path,cb){assert.strictEqual(path,'/lv_data');remoteCallback=cb;},
  fbSet(path,value){writes.push({path,value});if(autoResolve)return Promise.resolve(true);return new Promise(resolve=>{pendingWriteResolve=resolve;});},
  addEventListener(){}
};
const context={window,document,localStorage,console,Date,JSON,Object,Array,String,Number,Math,isFinite,Promise,setTimeout:()=>1,clearTimeout(){},setInterval:()=>9,clearInterval(){}};
vm.createContext(context);vm.runInContext(source,context);

(async function(){
  assert.strictEqual(document.documentElement.setAttribute instanceof Function,true);
  assert.strictEqual(typeof window.rbLeavePersistence.waitForSync,'function','confirmed save helper must be exposed');
  window.lvSaveDay(2026,8,28,[{uid:1,empId:'dom',type:'vac',updatedAt:100}]);
  await Promise.resolve();
  assert.ok(writes[0].path.startsWith('/lv_data/d/2026-8-28/e_'),'a changed leave entry must be written to its own child path');
  assert.ok(store.has('rb_leave_pending_v2'),'an unconfirmed leave edit must stay queued');

  remoteCallback(null,{d:{
    '2026-8-28':[{uid:1,empId:'dom',type:'hol',updatedAt:10}],
    '2026-8-29':[{uid:2,empId:'jam',type:'sick',updatedAt:200}]
  },u:3,t:50});
  assert.strictEqual(window.LV_DATA['2026-8-28'][0].type,'vac','stale cloud data must not replace the pending local edit');
  assert.strictEqual(window.LV_DATA['2026-8-29'][0].type,'sick','unrelated fresh cloud dates must still be merged');

  const pending=JSON.parse(store.get('rb_leave_pending_v2'));
  const merged=window._rbLeavePersistenceTest.mergePending({d:{a:[{uid:1}],b:[{uid:2}]},u:1,t:20},{d:{a:[{uid:9}]},u:1,t:30,dirty:['a']});
  assert.deepStrictEqual(merged.d.a.map(x=>x.uid),[9],'the pending day must win over the remote snapshot');
  assert.deepStrictEqual(merged.d.b.map(x=>x.uid),[2],'unrelated remote days must be preserved');
  assert.ok(pending.dirty.includes('2026-8-28'));

  autoResolve=true;pendingWriteResolve(true);
  await new Promise(resolve=>setImmediate(resolve));await new Promise(resolve=>setImmediate(resolve));
  assert.ok(writes.some(x=>x.path==='/lv_data/t'),'the queue should continue through metadata writes after the entry write succeeds');
  assert.strictEqual(store.has('rb_leave_pending_v2'),false,'the pending queue must clear only after every cloud write succeeds');

  const confirmedLocal=JSON.parse(store.get('lv_dash_v5'));
  const staleAccepted=window._rbLeavePersistenceTest.acceptRemote({d:{'2026-8-29':[{uid:2,empId:'jam',type:'sick'}]},u:3,t:confirmedLocal.t-1});
  assert.strictEqual(staleAccepted,'stale-ignored','a GET started before save confirmation must not roll the calendar back');
  assert.strictEqual(window.LV_DATA['2026-8-28'][0].type,'vac','the confirmed leave must survive a stale remote response');

  const normalized=window._rbLeavePersistenceTest.normalize({d:{'2026-9-1':{
    legacy:{uid:7,empId:'jam',type:'hol'},
    other:{uid:8,empId:'dom',type:'vac'}
  }},u:9,t:80});
  assert.strictEqual(normalized.d['2026-9-1'].length,2,'Firebase object children must be restored as leave rows');
  assert.deepStrictEqual(JSON.parse(JSON.stringify(normalized.d['2026-9-1'].map(x=>x.__cloudKey).sort())),['legacy','other']);

  store.delete('rb_leave_pending_v2');
  store.set('lv_dash_v5',JSON.stringify({d:{'2026-9-2':[{uid:1,empId:'dom',type:'hol'}]},u:2,t:100}));
  const accepted=window._rbLeavePersistenceTest.acceptRemote({d:{'2026-9-2':[{uid:2,empId:'jam',type:'sick'}]},u:3,t:999});
  assert.strictEqual(accepted,'remote-applied','a newer team revision must replace an older local snapshot');
  assert.strictEqual(window.LV_DATA['2026-9-2'][0].empId,'jam');
  const index=fs.readFileSync('index.html','utf8');
  assert.ok(index.includes('snippets/leave-persistence-v2.js?v=fix320'));
assert.ok(index.includes('<meta name="rb-build" content="fix352">'));
  console.log('leave-persistence-v2: all tests passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
