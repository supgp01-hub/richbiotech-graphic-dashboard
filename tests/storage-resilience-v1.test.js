const fs=require('fs');
const vm=require('vm');
const path=require('path');
const assert=require('assert');

class QuotaStorage{
  constructor(limit){this.limit=limit;this.values={};}
  getItem(key){return Object.prototype.hasOwnProperty.call(this.values,key)?this.values[key]:null;}
  removeItem(key){delete this.values[key];}
  setItem(key,value){
    value=String(value);
    const next=Object.assign({},this.values,{[key]:value});
    const size=Object.entries(next).reduce((sum,pair)=>sum+pair[0].length+pair[1].length,0);
    if(size>this.limit){const error=new Error('Setting the value exceeded the quota');error.name='QuotaExceededError';error.code=22;throw error;}
    this.values[key]=value;
  }
}

const storage=new QuotaStorage(6200);
const context={window:{localStorage:storage},console};context.window.window=context.window;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','snippets','storage-resilience-v1.js'),'utf8'),context);
const api=context.window.rbStorageResilience;

assert(api,'storage resilience helper must be installed');
assert.strictEqual(api.isQuotaError(Object.assign(new Error('quota'),{name:'QuotaExceededError'})),true);

const timeline=Array.from({length:300},(_,i)=>({ts:i,sec:'สั่งงาน',act:'แก้ไข',det:'x'.repeat(60),user:'View'}));
storage.values.rb_timeline_v1=JSON.stringify(timeline);
const timelineResult=api.storeTimeline(timeline,'rb_timeline_v1');
assert.strictEqual(timelineResult.ok,true,'timeline must compact instead of throwing');
assert(JSON.parse(storage.getItem('rb_timeline_v1')).length<300,'timeline cache must be bounded');

storage.values.rb_orders_last_good_v1='x'.repeat(3000);
const orders=[{id:'GR001',name:'งานทดสอบ',images:[{name:'large.png',type:'image/png',data:'x'.repeat(8000)}],briefImages:[],errorImages:[],fixImages:[]}];
const orderResult=api.storeOrders(orders,'rb_orders_v1');
assert.strictEqual(orderResult.ok,true,'orders must fall back to a compact cache when quota is tight');
assert.strictEqual(api.loadOrders('rb_orders_v1')[0].images[0].data.length,8000,'full order remains available in memory for the current session');
orders[0].status='review';
assert.strictEqual(api.loadOrderSnapshot('rb_orders_v1')[0].status,undefined,'the committed snapshot must not change when the live order array is mutated');
const cached=JSON.parse(storage.getItem('rb_orders_v1'));
assert.strictEqual(cached[0]._rbCacheCompacted,true,'local fallback must be marked compact');
assert.strictEqual(cached[0].images[0].data,undefined,'large image payload must not fill localStorage');

console.log('storage resilience v1 tests passed');
