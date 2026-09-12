const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const source=html.slice(html.indexOf('function fbWaitOrderOp('),html.indexOf('function fbRestoreDurableOrderQueue('));
async function run(mode){
 let now=0,flushes=0;
 const op={token:'save',path:'/orders/GR172',durable:true,durablePromise:Promise.resolve(true)};
 const ctx={Promise,Number,Date:{now:()=>now},navigator:{onLine:mode!=='offline'},FB_REQ_TIMEOUT:12000,
 fbOrderQueueLoad:()=>mode==='conflict'?[{...op,conflict:true,conflictMessage:'changed remotely'}]:now<800?[op]:[],
 fbFlushOrderQueue:()=>flushes++,setTimeout:fn=>{now+=160;queueMicrotask(fn);}};
 vm.createContext(ctx);vm.runInContext(source,ctx);
 const result=await ctx.fbWaitOrderOp(op,mode==='timeout'?400:1500);
 return {result,now,flushes};
}
(async()=>{
 let r=await run('online');assert.equal(r.result.confirmed,true);assert(r.now>=800,'durable receipt must not finish before server ack');
 r=await run('offline');assert.equal(r.result.confirmed,false);assert.equal(r.result.durable,true);assert.equal(r.now,0);
 r=await run('conflict');assert.equal(r.result.confirmed,false);assert.equal(r.result.error,'changed remotely');
 r=await run('timeout');assert.equal(r.result.confirmed,false);assert.equal(r.result.durable,true);
 console.log('PASS: delayed online acknowledgement, offline durability, conflict and timeout');
})().catch(e=>{console.error(e);process.exitCode=1});
