const assert=require('assert');
const fs=require('fs');
const vm=require('vm');

const source=fs.readFileSync('snippets/leave-persistence-v2.js','utf8');
const store=new Map();
let remoteCallback=null;
let writes=[];
let pendingWriteResolve=null;
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
  fbSet(path,value){writes.push({path,value});return new Promise(resolve=>{pendingWriteResolve=resolve;});},
  addEventListener(){}
};
const context={window,document,localStorage,console,Date,JSON,Object,Array,String,Number,Math,isFinite,Promise,setTimeout:()=>1,clearTimeout(){},setInterval:()=>9,clearInterval(){}};
vm.createContext(context);vm.runInContext(source,context);

(async function(){
  assert.strictEqual(document.documentElement.setAttribute instanceof Function,true);
  window.lvSaveDay(2026,8,28,[{uid:1,empId:'dom',type:'vac',updatedAt:100}]);
  await Promise.resolve();
  assert.strictEqual(writes[0].path,'/lv_data/d/2026-8-28','a changed day must be written independently');
  assert.ok(store.has('rb_leave_pending_v2'),'an unconfirmed leave edit must stay queued');

  remoteCallback(null,{d:{
    '2026-8-28':[{uid:1,empId:'dom',type:'hol',updatedAt:10}],
    '2026-8-29':[{uid:2,empId:'jam',type:'sick',updatedAt:200}]
  },u:3,t:50});
  assert.strictEqual(window.LV_DATA['2026-8-28'][0].type,'vac','stale cloud data must not replace the pending local edit');
  assert.strictEqual(window.LV_DATA['2026-8-29'][0].type,'sick','unrelated fresh cloud dates must still be merged');

  const pending=JSON.parse(store.get('rb_leave_pending_v2'));
  const merged=window._rbLeavePersistenceTest.mergePending({d:{a:[1],b:[2]},u:1,t:20},{d:{a:[9]},u:1,t:30,dirty:['a']});
  assert.deepStrictEqual(JSON.parse(JSON.stringify(merged.d)),{a:[9],b:[2]},'only dirty dates should win over the remote snapshot');
  assert.ok(pending.dirty.includes('2026-8-28'));

  pendingWriteResolve(true);
  await new Promise(resolve=>setImmediate(resolve));
  assert.ok(writes.length>=2,'the queue should continue through metadata writes after the date write succeeds');
  const index=fs.readFileSync('index.html','utf8');
  assert.ok(index.includes('snippets/leave-persistence-v2.js?v=fix300'));
assert.ok(index.includes('<meta name="rb-build" content="fix306">'));
  console.log('leave-persistence-v2: all tests passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
