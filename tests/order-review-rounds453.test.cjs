const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'snippets/order-review-rounds-v1.js'),'utf8');
const dom=new JSDOM('<!doctype html><body><button id="opener">Open</button><table><tbody><tr></tr></tbody></table>',{runScripts:'outside-only',url:'https://example.test'});
const w=dom.window;w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
w.eval(source);const r=w.rbReviewRounds,clone=x=>JSON.parse(JSON.stringify(x));let t=100000;
let row={id:'QA_ROUNDS',_fbKey:'qa_rounds',status:'pending',assignee:'DOM',auditVersions:[],revisionSubmissions:[]};
r.prepare(null,row,{name:'View'},t++);
function transition(status,change={},user='DOM') {const next=Object.assign(clone(row),change,{status});if(status==='review'&&user==='DOM')next._rbReviewSubmit=true;r.prepare(row,next,{name:user},t+=1000);row=next;return row;}
transition('inprogress');assert.equal(r.summary(row).corrections,0);
transition('review',{submitLinks:['https://example.test/hook1','https://example.test/hook2']});
assert.equal(r.label(row),'รอตรวจครั้งที่ 1');assert.equal(r.countLabel(row),'0 ครั้ง');
function request(note){return transition('revision',{auditVersions:[1,2].map(version=>({version,result:'issue',note,correctionRequestedAt:t+1}))},'QA Audit');}
function resubmit(){return transition('review',{revisionSubmissions:row.revisionSubmissions.concat({at:t+1,by:'DOM',links:['https://example.test/hook1','https://example.test/hook2'],imageLinks:[],note:'Both HOOKs corrected'})});}
request('Fix both');const firstRequest=clone(row.reviewRounds);
transition('revision');assert.deepEqual(row.reviewRounds,firstRequest,'repeated Audit revision decision must not open another cycle');
assert.equal(r.label(row),'ต้องแก้ไข • รอบ 1');resubmit();
assert.equal(r.label(row),'รอตรวจครั้งที่ 2');assert.equal(r.countLabel(row),'1 ครั้ง');
assert.ok(row.revisionSubmissions[0].submissionId);assert.equal(r.summary(row).events.filter(e=>e.kind==='resubmitted').length,1);
const submitted=clone(row);r.prepare(submitted,row,{name:'DOM'},t+1);assert.deepEqual(clone(row),submitted,'retrying persisted data must not add a round');
resubmit();assert.equal(r.summary(row).corrections,1,'duplicate review submission belongs to the existing cycle');
assert.equal(row.revisionSubmissions.at(-1).cycleId,row.revisionSubmissions[0].cycleId);
request('Second decision, same files allowed');assert.equal(r.label(row),'ต้องแก้ไข • รอบ 2');resubmit();
assert.equal(r.summary(row).corrections,2);assert.equal(r.label(row),'รอตรวจครั้งที่ 3');
transition('done',{},'QA Audit');assert.equal(r.summary(row).corrections,2);assert.equal(r.label(row),'เสร็จสมบูรณ์');
assert.equal(r.summary(JSON.parse(JSON.stringify(row))).corrections,2,'reload persists ledger');
const pendingBefore=clone(row);transition('pending',{},'View');transition('review',{},'View');assert.equal(r.summary(row).reviewNumber,null,'a bulk reset to review must not fabricate an employee submission');row=pendingBefore;

const legacy={id:'LEGACY',status:'review',assignee:'JAM',firstSubmittedAt:100,auditVersions:[{version:1,result:'issue',correctionRequestedAt:200},{version:2,result:'issue',correctionRequestedAt:201}],revisionSubmissions:[300,313,314].map(at=>({at,by:'JAM',links:['https://example.test/ad'],note:'same'}))};
assert.equal(r.summary(legacy).corrections,1,'three repeated clicks after one Audit request are one round');assert.equal(r.label(legacy),'รอตรวจครั้งที่ 2');assert.equal(r.summary(legacy).events.at(-1).attempts,3);
assert.equal(r.summary({...legacy,firstSubmittedAt:0}).reviewNumber,null,'do not invent missing first submission');
assert.equal(r.countLabel({status:'review'}),'ยังยืนยันไม่ได้');
assert.equal(r.summary({...legacy,revisionSubmissions:[]}).complete,false,'old issue flags with missing resubmission are ambiguous');
assert.equal(r.summary({...legacy,revisionSubmissions:[{at:'invalid'}]}).complete,false);
const different={status:'review',firstSubmittedAt:10,revisionSubmissions:[{at:100,by:'DOM',links:['https://example.test/1']},{at:200,by:'DOM',links:['https://example.test/2']},{at:70000,by:'DOM',links:['https://example.test/2']}]};
assert.equal(r.summary(different).corrections,3,'different evidence or distant submissions are not collapsed');
assert.equal(r.summary(different).complete,false,'unlinked legacy history must not pretend to establish a complete cycle sequence');
const bulk={id:'BULK',_fbKey:'bulk',status:'review'};r.prepare({id:'BULK',_fbKey:'bulk',status:'pending'},bulk,{name:'View',role:'sup'},t++);assert.equal(r.summary(bulk).reviewNumber,null,'changing status alone is not an initial employee submission');
assert.notEqual(r.signature(legacy),r.signature({...legacy,revisionSubmissions:legacy.revisionSubmissions.concat({at:500,cycleId:'next'})}));

w._rbUser={name:'DOM',role:'graphic'};w.lpORD=()=>[row];w.rbOrderMatchesAssignee=(o,n)=>o.assignee===n;w.rbOrderSync={queue:()=>[]};
r.appendCountCell(w.document.querySelector('tr'),row,false);assert.match(w.document.querySelector('td').textContent,/2 ครั้ง/);
w.document.querySelector('.rb-round-history-button').click();assert.equal(w.document.querySelector('dialog').open,true);assert.equal(w.document.querySelectorAll('.rb-round-links a').length,6);
w.document.querySelector('dialog header button').click();assert.equal(w.document.querySelector('dialog').open,false);
w._rbUser={name:'OTHER',role:'graphic'};r.show('qa_rounds');assert.equal(w.document.querySelector('dialog').open,false,'another employee cannot open this history');
w._rbUser={name:'Audit',role:'audit'};row.reviewRounds.events[0].note='<img src=x onerror=alert(1)>';row.reviewRounds.events[0].links=['javascript:alert(1)','https://example.test/?a="<x>'];
r.show('qa_rounds');assert.equal(w.document.querySelectorAll('dialog img').length,0);assert.equal(w.document.querySelectorAll('dialog a[href^="javascript:"]').length,0);
w.rbOrderSync.queue=()=>[{path:'/orders/qa_rounds'}];r.refresh();assert.match(w.document.querySelector('dialog').textContent,/ยังไม่ยืนยันออนไลน์/);
w._rbUser={name:'OTHER',role:'graphic'};r.refresh();assert.equal(w.document.querySelector('dialog').open,false,'role change closes unauthorized history');

// The existing ETag writer must commit the ledger atomically with status and
// history, then recognize retries after a lost acknowledgement without a PUT.
const env={window:{},Response};vm.runInNewContext(fs.readFileSync(path.join(root,'snippets/safe-order-write-v1.js'),'utf8'),env);
(async()=>{
 const remote={...clone(submitted),updatedAt:10,_syncRevision:1};let online=clone(remote),puts=0,offline=true;
 const change={status:'revision',reviewRounds:clone(firstRequest),updatedAt:20};
 const options={method:'PATCH',body:JSON.stringify(change),rbBaseUpdatedAt:10,rbBaseValues:{status:remote.status,reviewRounds:remote.reviewRounds},rbWriteToken:'round-token'};
 const transport=async(url,opt)=>{if(offline)throw new Error('offline');if(opt.method==='PUT'){online=JSON.parse(opt.body);puts++;return new Response('{}',{status:200});}return new Response(JSON.stringify(online),{status:200,headers:{ETag:'"1"'}});};
 await assert.rejects(env.window.rbSafeOrderWrite.write('https://example.test/orders/qa.json',options,transport),/offline/);assert.equal(puts,0);assert.equal(online.status,'review');
 offline=false;await env.window.rbSafeOrderWrite.write('https://example.test/orders/qa.json',options,transport);assert.equal(puts,1);assert.equal(online.status,'revision');assert.deepEqual(online.reviewRounds,firstRequest);
 await env.window.rbSafeOrderWrite.write('https://example.test/orders/qa.json',options,transport);assert.equal(puts,1,'retry after lost acknowledgement does not create another event');
 online._lastWriteToken='other-editor';online.reviewRounds={version:1,events:[{id:'new-online-cycle'}]};
 await assert.rejects(env.window.rbSafeOrderWrite.write('https://example.test/orders/qa.json',{...options,rbWriteToken:'stale-editor'},transport),e=>e.code==='RB_ORDER_CONFLICT');assert.equal(puts,1,'concurrent history changes cannot be overwritten');
 dom.window.close();console.log('review rounds 453: lifecycle, duplicate clicks, two HOOKs, legacy, roles, history, offline and concurrent writes passed');
})().catch(e=>{console.error(e);process.exitCode=1;dom.window.close();});
