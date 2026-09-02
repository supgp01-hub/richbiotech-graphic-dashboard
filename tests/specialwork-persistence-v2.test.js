const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const source=fs.readFileSync('snippets/specialwork-persistence-v2.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const store=new Map();
const writes=[];
const legacy=[
  {id:'sw_dom',empId:'dom',cat:'wfh',dates:['2026-9-2'],updatedAt:10},
  {id:'sw_jam',empId:'jam',cat:'office',dates:['2026-9-2'],updatedAt:10}
];
const remote={items:{},deleted:{}};
const localStorage={
  getItem:key=>store.has(key)?store.get(key):null,
  setItem:(key,value)=>store.set(key,String(value))
};
const document={documentElement:{setAttribute(name,value){this[name]=value;}}};
const window={
  document,localStorage,_rbUser:{name:'Dom'},
  fbGet(path,callback){
    if(path==='/specialwork')return callback(null,legacy);
    if(path==='/specialwork_v2/items')return callback(null,remote.items);
    if(path==='/specialwork_v2/deleted')return callback(null,remote.deleted);
    callback(null,null);
  },
  fbSet(path,value){writes.push({path,value});return Promise.resolve(true);}
};
vm.runInNewContext(source,{window,document,localStorage,Promise,Date,JSON,Object,Array,String,Number,Math,console});

(async()=>{
  const initial=await new Promise((resolve,reject)=>window.fbGet('/specialwork',(error,value)=>error?reject(error):resolve(value)));
  assert.deepEqual(initial.map(row=>row.id),['sw_dom','sw_jam'],'legacy rows must remain readable during migration');

  await window.fbSet('/specialwork',[
    {...initial[0],cat:'office',updatedAt:20},
    initial[1]
  ]);
  assert.equal(writes.some(write=>write.path==='/specialwork'),false,'a shared collection write must never be used');
  assert.equal(writes.some(write=>write.path==='/specialwork_v2/items/sw_dom'),true,'only the changed employee record must be written');
  assert.equal(writes.some(write=>write.path==='/specialwork_v2/items/sw_jam'),false,'an unchanged coworker record must not be rewritten');

  writes.length=0;
  await window.fbSet('/specialwork',[{...initial[0],cat:'office',updatedAt:20}]);
  assert.equal(writes.some(write=>write.path==='/specialwork_v2/deleted/sw_jam'&&write.value&&write.value.by==='Dom'),true,'deleting one row must create only that row tombstone');

  const merged=window.rbSpecialworkPersistence.merge(legacy,{sw_dom:{...legacy[0],cat:'office'}},{sw_jam:{at:30}});
  assert.deepEqual(merged.map(row=>row.id),['sw_dom']);
  assert.equal(merged[0].cat,'office');
  assert.equal(document.documentElement['data-specialwork-persistence'],'2.1.0');
  const preserved=window.rbSpecialworkPersistence.lastRows();
  assert.equal(preserved.length,1,'the confirmed local record list remains available for offline fallback');

  const offlineStore=new Map([["rb_specialwork_v1",JSON.stringify([{id:'sw_offline',empId:'ter',cat:'wfh'}])]]);
  const offlineStorage={getItem:key=>offlineStore.get(key)||null,setItem:(key,value)=>offlineStore.set(key,String(value))};
  const offlineDocument={documentElement:{setAttribute(){}}};
  const offlineWindow={document:offlineDocument,localStorage:offlineStorage,fbGet(path,callback){callback(new Error('offline'),null);},fbSet(){return Promise.resolve(false);}};
  vm.runInNewContext(source,{window:offlineWindow,document:offlineDocument,localStorage:offlineStorage,Promise,Date,JSON,Object,Array,String,Number,Math,console,setTimeout:()=>1,clearTimeout(){}});
  const offlineRows=await new Promise(resolve=>offlineWindow.fbGet('/specialwork',(error,value)=>resolve({error,value})));
  assert.ok(offlineRows.error,'offline reads must report the connection error so the existing UI uses local data');
  assert.equal(JSON.parse(offlineStore.get('rb_specialwork_v1')).length,1,'an offline refresh must not erase saved special-work rows');
  await offlineWindow.fbSet('/specialwork',[{id:'sw_offline',empId:'ter',cat:'office'}]);
  assert.equal(offlineWindow.rbSpecialworkPersistence.pendingFor('sw_offline'),true,'failed online writes must remain queued per employee record');
  assert.ok(index.includes('snippets/specialwork-persistence-v2.js?v=fix324'));
  console.log('specialwork-persistence-v2: per-record writes and migration passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
