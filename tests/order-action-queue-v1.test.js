const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const html=fs.readFileSync('index.html','utf8');
const start=html.indexOf('function fbOrderQueueLoad()');
const end=html.indexOf('function fbScheduleStreamRefresh()',start);
assert.ok(start>0&&end>start,'order queue runtime must be extractable');

const values=new Map();
const localStorage={
  getItem:key=>values.has(key)?values.get(key):null,
  setItem:(key,value)=>values.set(key,String(value))
};
let requests=0;
const context={
  Promise,JSON,Math,Date,setTimeout,clearTimeout,console,
  localStorage,navigator:{onLine:true},window:{rbStorageResilience:null},
  FB_ORDER_QUEUE:'rb_order_write_queue_v1',_fbOrderMemoryQueue:[],
  _fbOrderFlushActive:false,_fbOrderRetryTimer:null,_fbSse:null,
  FB_REQ_TIMEOUT:120,FB_DB:'https://example.test',
  FB_ORDER_ASSET_FIELDS:['images','briefImages','errorImages','fixImages'],
  fbIsLeader:()=>false,fbSetSyncState:()=>{},
  fbFetch:()=>{requests++;return Promise.resolve({ok:true});}
};
vm.createContext(context);
vm.runInContext(html.slice(start,end),context);

(async()=>{
  const op=context.fbQueueOrderOp('PATCH','order_GR111',{status:'done'});
  const receipt=await context.fbWaitOrderOp(op,800);
  assert.equal(requests,1,'the current non-leader tab must send an explicit user action');
  assert.equal(receipt.confirmed,true,'the user action must receive an online confirmation');
  assert.equal(JSON.parse(localStorage.getItem(context.FB_ORDER_QUEUE)||'[]').length,0,'the confirmed operation must leave the queue');
  console.log('order-action-queue-v1: non-leader explicit saves are confirmed');
})().catch(error=>{console.error(error);process.exitCode=1;});
