const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const html=fs.readFileSync('index.html','utf8'),ops=fs.readFileSync('snippets/workflow-ops-v1.js','utf8');
test('concurrent reads share transport, isolate consumers and do not cache completed data',async()=>{
 let calls=0,finish;
 const c={window:{},FB_DB:'https://example.test',FB_REQ_TIMEOUT:20000,fbFetch(){calls++;return new Promise(r=>finish=r)},JSON,Promise};vm.createContext(c);
 vm.runInContext(html.slice(html.indexOf('var _fbReadsInFlight='),html.indexOf('window.fbSet=function')),c);
 const get=()=>new Promise((resolve,reject)=>c.window.fbGet('/orders',(e,d)=>e?reject(e):resolve(d)));
 const a=get(),b=get();assert.equal(calls,1);finish({json:()=>({row:{name:'current'}})});
 const [x,y]=await Promise.all([a,b]);x.row.name='changed';assert.equal(y.row.name,'current');
 const next=get();assert.equal(calls,2);finish({json:()=>({row:{name:'new'}})});assert.equal((await next).row.name,'new');
});
test('failed shared read is evicted and can be retried',async()=>{
 let calls=0;
 const c={window:{},FB_DB:'x',FB_REQ_TIMEOUT:1,fbFetch(){calls++;return calls===1?Promise.reject(new Error('offline')):Promise.resolve({json:()=>null})},JSON,Promise};vm.createContext(c);
 vm.runInContext(html.slice(html.indexOf('var _fbReadsInFlight='),html.indexOf('window.fbSet=function')),c);
 const get=()=>new Promise(r=>c.window.fbGet('/orders',(e,d)=>r({e,d})));
 assert((await get()).e);assert.equal((await get()).d,null);assert.equal(calls,2);
});
test('audit requests are bounded, authenticated, cursor based, and never persist bulk history',async()=>{
 const requests=[];let fail=false;
 const c={auditHydrated:false,auditHydrating:false,navigator:{onLine:true},cloudBase:'https://example.test',window:{},modal:null,Promise,JSON,Object,Error,encodeURIComponent,auditLoad:()=>[],fbFetch(url){requests.push(url);if(fail)return Promise.reject(new Error('offline'));const q=new URL(url).searchParams,start=JSON.parse(q.get('startAt')),end=JSON.parse(q.get('endAt'));const data={};if(start==='evt_'){const top=end.startsWith('evt_019')?18:39;for(let i=top;i>=Math.max(0,top-20);i--){const key='evt_'+String(i).padStart(3,'0');data[key]={id:key,ts:i,before:{title:'preserved'}}}}return Promise.resolve({ok:true,json:()=>data})}};
 vm.createContext(c);vm.runInContext(ops.slice(ops.indexOf('var auditRemote='),ops.indexOf('function addAudit')),c);
 await c.hydrateAudit();assert.equal(requests.length,2);requests.forEach(url=>{const q=new URL(url).searchParams;assert.equal(q.get('limitToLast'),'21');assert.equal(JSON.parse(q.get('orderBy')),'$key')});
 assert.equal(c.auditPageRows().length,21);assert.equal(c.auditPageRows()[0].before.title,'preserved');
 await c.hydrateAudit();assert.equal(requests.length,2);
 fail=true;await c.hydrateAudit(true);assert(c.auditError);assert.equal(c.auditPageRows().length,21);
 fail=false;await c.hydrateAudit(true);assert.equal(c.auditError,'');assert(requests.some(url=>new URL(url).searchParams.get('endAt')==='"evt_019"'));
});
