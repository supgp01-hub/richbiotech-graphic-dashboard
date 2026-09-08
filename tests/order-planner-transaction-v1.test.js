const fs=require('fs');
const assert=require('assert');
const vm=require('vm');

const source=fs.readFileSync('snippets/order-planner-v1.js','utf8');
const cloudWrites=[];
let savedOrders=[];
let rawFetches=0;
const staleDraft={
  id:'draft-exact-1',name:'ชื่อเก่าจากออนไลน์',product:'So Pink',type:'กราฟิก',
  assignee:'DOM',deadline:'2026-09-09',scheduledDate:'2026-09-07',dispatchTime:'08:30',
  status:'scheduled',updatedAt:1,briefImages:[]
};
const exactDraft=Object.assign({},staleDraft,{
  name:'ชื่อใหม่ที่ Supervisor เลือก',assignee:'BALL',brief:'รายละเอียดล่าสุด',
  briefImages:[{name:'sample.jpg',type:'image/jpeg',data:'data:image/jpeg;base64,AA=='}],
  updatedAt:Date.now()
});

const storage={};
const window={
  _rbUser:{name:'Supervisor',role:'sup'},
  addEventListener(){},
  fbGet(path,callback){
    if(path==='/order_planner/drafts')callback(null,{stale:staleDraft});
    else if(path==='/order_planner/rules')callback(null,{enabled:true,recurring:false,absencePolicy:'hold',overduePolicy:'dispatch'});
    else if(path==='/orders')callback(null,{});
    else callback(null,null);
  },
  fbSet(path,data){cloudWrites.push({path,data:JSON.parse(JSON.stringify(data))});return Promise.resolve(true)},
  rbReserveOrderId(){return Promise.resolve('GR901')},
  lpORD(){return savedOrders.slice()},
  spORD(orders){savedOrders=JSON.parse(JSON.stringify(orders));return Promise.resolve({ok:true,online:true})}
};
const sandbox={
  window,document:{readyState:'loading',addEventListener(){},documentElement:{setAttribute(){}}},
  localStorage:{getItem(key){return storage[key]||null},setItem(key,value){storage[key]=value}},
  console,Date,JSON,Object,Array,String,Number,Math,Promise,
  setTimeout(){return 1},clearTimeout(){},setInterval(){return 1},
  fetch(){rawFetches++;return Promise.reject(new Error('raw fetch must not be used'))}
};

vm.runInNewContext(source,sandbox);
const api=window._rbOrderPlannerTest;

api.runWorker([exactDraft.id],[exactDraft]).then(results=>{
  assert.strictEqual(rawFetches,0,'dispatch must use authenticated fbGet instead of an unauthenticated raw fetch');
  assert.strictEqual(results.length,1,'the selected draft must dispatch exactly once');
  assert.strictEqual(results[0].ok,true,'the selected draft must dispatch successfully');
  assert.strictEqual(savedOrders.length,1,'the durable order pipeline must receive one order');
  assert.strictEqual(savedOrders[0].name,exactDraft.name,'the dispatched order must use the latest selected name, not stale cloud data');
  assert.strictEqual(savedOrders[0].assignee,exactDraft.assignee,'the dispatched order must keep the exact selected assignee');
  assert.strictEqual(savedOrders[0].sourceDraftId,exactDraft.id,'the order must stay bound to one exact draft id');
  assert.strictEqual(savedOrders[0]._fbKey,'planner_'+exactDraft.id,'the local order must use the same idempotent key as the cloud order');
  assert.strictEqual(savedOrders[0].briefImages.length,1,'sample images must travel through the durable order asset pipeline');
  assert.ok(cloudWrites.some(write=>write.path==='/order_planner/drafts/'+exactDraft.id&&write.data.status==='dispatched'),'the exact source draft must be marked dispatched');
  const sent=results[0].draft;
  const pending=Object.assign({},exactDraft,{status:'scheduled',updatedAt:sent.updatedAt+10000});
  api.markDraftPending(pending.id);
  const merged=api.mergeDraftCollections([sent],[pending],Date.now());
  assert.strictEqual(merged[0].status,'dispatched','stale pending edits must not reopen an already dispatched draft');
  assert.strictEqual(api.mergeDraftCollections([pending],[sent],Date.now())[0].status,'dispatched','a stale cloud read must not roll back a completed dispatch');
  api.protectDraftEdit(pending);
  assert.strictEqual(api.overlayDraftEdits([sent])[0].status,'dispatched','the form edit buffer must not restore the scheduled status');
  assert.strictEqual(api.filterByStatus(merged,'scheduled').length,0,'dispatched work must leave the automatic queue');
  assert.strictEqual(api.filterByStatus(merged,'dispatched').length,1,'dispatched work must remain available in history');
  console.log('order-planner transaction: exact snapshot dispatch passed');
}).catch(error=>{console.error(error);process.exitCode=1});
