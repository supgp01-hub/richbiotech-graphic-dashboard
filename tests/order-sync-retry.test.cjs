const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const html=fs.readFileSync('index.html','utf8'),start=html.indexOf('function fbOrderQueueLoad()'),end=html.indexOf('function fbScheduleStreamRefresh()',start);
const values=new Map(),timers=[];let requests=[],failFirst=true,clock=Date.now();
const ctx={Promise,JSON,Math,Date:{now:()=>clock},console,setTimeout:(fn,ms)=>{timers.push({fn,ms});return timers.length;},clearTimeout:()=>{},localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,String(v))},navigator:{onLine:true},window:{rbDurableOrderQueue:{persist:(q,k,m)=>{ctx.localStorage.setItem(k,JSON.stringify(q));m([]);return{durable:true,promise:Promise.resolve(true)}}}},_fbRecentOrderWrites:{},FB_ORDER_QUEUE:'queue',_fbOrderMemoryQueue:[],_fbOrderFlushActive:false,_fbOrderRetryTimer:null,_fbSse:null,FB_REQ_TIMEOUT:120,FB_DB:'https://example.test',FB_ORDER_ASSET_FIELDS:[],fbIsLeader:()=>false,fbSetSyncState:()=>{},refreshOrderViews:()=>{},fbFetch:(url)=>{requests.push(url);if(failFirst){failFirst=false;return Promise.reject(new Error('network timeout'));}return Promise.resolve({ok:true});}};
vm.createContext(ctx);vm.runInContext(html.slice(start,end),ctx);
(async()=>{
ctx.fbQueueOrderOp('PATCH','NUNE',{status:'review'});ctx.fbQueueOrderOp('PATCH','BALL',{status:'review'});
await new Promise(setImmediate);
assert.equal(ctx.fbOrderQueueLoad().length,2);
const retry=timers.shift();assert(retry.ms>=250,'failed writes retain backoff');clock+=retry.ms;retry.fn();await new Promise(setImmediate);
// Successful second job drains first job as well without relying on a leader tab.
while(timers.length&&ctx.fbOrderQueueLoad().length){const timer=timers.shift();clock+=timer.ms;timer.fn();await new Promise(setImmediate);}
assert.equal(ctx.fbOrderQueueLoad().length,0);assert(requests.some(x=>x.endsWith('/NUNE.json')));assert(requests.some(x=>x.endsWith('/BALL.json')));assert.equal(requests.length,3);
console.log('PASS: non-leader network failure retries and drains all staff jobs without another click');
})().catch(e=>{console.error(e);process.exitCode=1});
