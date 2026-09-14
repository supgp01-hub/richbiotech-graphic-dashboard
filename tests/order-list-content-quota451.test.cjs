const fs=require('fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const tick=()=>new Promise(r=>setTimeout(r,15));
function setup(){
 const dom=new JSDOM('<main></main>',{url:'https://example.test',runScripts:'outside-only'}),w=dom.window;
 w._rbUser={uid:'qa',name:'Tester',role:'graphic'};w.AbortController=AbortController;w.ctRender=()=>{};
 const db={},versions={},writes=[];let fail='',afterWrite=()=>{},readFailure=false;
 w.rbFirebaseAuth={fetch:async(url,o)=>{const p=new URL(url).pathname,e='v'+(versions[p]||0);
  if(o.method==='PUT'){
   if(p.includes(fail)&&fail)throw Error('offline');
   if(o.headers['if-match']!==e)return new Response('{}',{status:412});
   db[p]=JSON.parse(o.body);versions[p]=(versions[p]||0)+1;writes.push(p);afterWrite();
   return new Response(JSON.stringify(db[p]));
  }
  if(readFailure)throw Error('readback failed');
  return new Response(JSON.stringify(db[p]||null),{headers:{ETag:e}});
 }};
 for(const f of ['content-submissions-v1.js','order-list-content-v1.js'])w.eval(fs.readFileSync('snippets/'+f,'utf8'));
 const host=w.document.querySelector('main'),targets=[{id:'a',slot:1,hook:'A'},{id:'b',slot:2,hook:'B'}];
 function mount(){host.replaceChildren();return w.rbOrderListContent.mount(host,{id:'QA',product:'So Pink'},()=>targets);}
 function enter(i,text){const el=host.querySelectorAll('textarea')[i];el.value=text;el.dispatchEvent(new w.Event('input'));}
 function denyStorage(){w.Storage.prototype.setItem=()=>{throw new w.DOMException('quota','QuotaExceededError');};}
 return{w,host,db,writes,mount,enter,denyStorage,close:()=>dom.window.close(),set fail(v){fail=v;},set afterWrite(v){afterWrite=v;},set readFailure(v){readFailure=v;}};
}
(async()=>{
 // Exercise the actual order modal completion path, not only the isolated List Content API.
 {const t=setup();try{t.mount();await tick();t.enter(0,'dispatch content');t.denyStorage();let closed=0,feedback='';const w=t.w;
  Object.assign(w,{_omActionBusy:false,_omUploadPending:0,_omAssetsReady:true,omPendingSignature:()=>t.host.querySelector('textarea').value,setOMActionBusy:b=>w._omActionBusy=b,setOMSubmitFeedback:s=>feedback=s,spORD:async()=>({ok:true,online:true}),closeOM2:()=>closed++});
  const html=fs.readFileSync('index.html','utf8'),start=html.indexOf('  function persistOMAndFinish(orders,options){');w.eval(html.slice(start,html.indexOf('  var OM_DRAFT_FIELDS=',start)));
  assert.equal(await w.persistOMAndFinish([{id:'QA'}]),true);assert.equal(closed,1);assert(!feedback.includes('ไม่สำเร็จ'));assert.equal(w._omActionBusy,false);assert.equal(t.writes.length,1);
 }finally{t.close();}}
 // Reproduce the reported failure: both writes are confirmed, but local cleanup runs at quota.
 {const t=setup();try{const e=t.mount();await tick();t.enter(0,'one');t.enter(1,'two');t.denyStorage();await e.capture()();assert.equal(t.writes.length,2);assert.equal(t.w.localStorage.length,0,'empty draft key must be removed');assert([...t.host.querySelectorAll('[role=status]')].every(x=>x.textContent==='✓ ซิงก์แล้ว'));await e.capture()();assert.equal(t.writes.length,2);}finally{t.close();}}
 // Full storage before typing + partial online failure: preserve only the unsent hook and retry once.
 {const t=setup();try{let e=t.mount();await tick();t.denyStorage();t.enter(0,'one');t.enter(1,'two');assert(t.host.textContent.includes('เก็บฉบับร่างในเครื่องไม่ได้'));t.fail=t.w.ctSubmissions.key('b');await assert.rejects(e.capture()(),/offline/);assert.equal(t.writes.length,1);assert.equal(t.host.querySelector('[role=status]').textContent,'✓ ซิงก์แล้ว');e=t.mount();await tick();assert.equal(t.host.querySelectorAll('textarea')[1].value,'two','reopening modal must retain memory draft');t.fail='';await e.capture()();assert.equal(t.writes.length,2);assert.equal(t.w.ctSubmissions.entries('b')[0].text,'two');}finally{t.close();}}
 // Old receipt left by a previous build is reconciled against verified online text without another PUT.
 {const t=setup();try{let e=t.mount();await tick();t.enter(0,'one');const stale=t.w.localStorage.getItem('rb_order_list_draft_v1:qa:QA');await e.capture()();t.w.localStorage.setItem('rb_order_list_draft_v1:qa:QA',stale);t.w.eval(fs.readFileSync('snippets/order-list-content-v1.js','utf8'));e=t.mount();await tick();await e.capture()();assert.equal(t.writes.length,1);assert.equal(t.w.localStorage.length,0);}finally{t.close();}}
 // A new edit during an in-flight save must not be cleared or called synced.
 {const t=setup();try{const e=t.mount();await tick();t.enter(0,'first');t.afterWrite=()=>{t.afterWrite=()=>{};t.enter(0,'newer');};await e.capture()();assert(t.host.querySelector('[role=status]').textContent.includes('มีข้อความใหม่'));await e.capture()();assert.equal(t.w.ctSubmissions.entries('a')[0].text,'newer');assert.equal(t.writes.length,2);}finally{t.close();}}
 // Successful PUT alone is insufficient: require readback before reporting online success.
 {const t=setup();try{const e=t.mount();await tick();t.enter(0,'one');t.afterWrite=()=>{t.readFailure=true;};await assert.rejects(e.capture()(),/readback failed/);assert(!t.host.querySelector('[role=status]').textContent.includes('✓'));t.readFailure=false;t.afterWrite=()=>{};await e.capture()();assert.equal(t.writes.length,1,'retry recognizes server success without duplicate write');}finally{t.close();}}
 console.log('PASS: quota after/before save, two-hook partial retry, stale receipt recovery, in-flight edits, readback failure');
})().catch(e=>{console.error(e);process.exitCode=1;});
