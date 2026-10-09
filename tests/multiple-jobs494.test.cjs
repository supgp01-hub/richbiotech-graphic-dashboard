const fs=require('fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const dom=new JSDOM('<main></main>',{url:'https://example.test',runScripts:'outside-only'}),w=dom.window;
const rows=[{id:'a',brand:'A',name:'First',hook:'Same'},{id:'b',brand:'A',name:'Second',hook:'Same'},{id:'c',brand:'A',name:'Second',hook:'Other'}];
w._rbUser={uid:'qa',name:'DOM',role:'graphic'};w.AbortController=AbortController;
const db={},versions={},writes=[];let fail='';
w.rbFirebaseAuth={fetch:async(url,o)=>{const p=new URL(url).pathname,etag='v'+(versions[p]||0);if(o.method==='PUT'){if(fail&&p.includes(fail))throw Error('offline');if(o.headers['if-match']!==etag)return new Response('{}',{status:412});db[p]=JSON.parse(o.body);db[p].updatedAt=Date.now();versions[p]=(versions[p]||0)+1;writes.push(p);return new Response(JSON.stringify(db[p]));}return new Response(JSON.stringify(db[p]||null),{headers:{ETag:etag}});}};
for(const f of ['content-submissions','order-multiple-jobs','order-content-selection','order-list-content','employee-job-details','content-hook-history'])w.eval(fs.readFileSync('snippets/'+f+'-v1.js','utf8'));
const order={id:'QA494',product:'A',assignee:'DOM',name:'First',hook:'Same',contentBindings:[{id:'a',hook:'Same'},{id:'b',hook:'Same'},{id:'c',hook:'Other'}],jobExtra:[{name:'Second',hook:'Same',hook2:'Other',contentBindings:[{id:'b',hook:'Same'},{id:'c',hook:'Other'}]}]};
const tick=()=>new Promise(r=>setTimeout(r,15));
(async()=>{try{
 w.rbEmployeeJobDetails.mount(w.document.querySelector('main'),order,{rows:()=>rows,save:async()=>{}});await tick();const box=w.document.querySelector('#rb-employee-job-details');
 const inputs=()=>box.querySelectorAll('.olc-card textarea');function enter(i,text){inputs()[i].value=text;inputs()[i].dispatchEvent(new w.Event('input'));}
 assert.deepEqual(Array.from(w.rbEmployeeJobDetails.read(order).contentBindings,b=>b.id),['a','b','c']);
 enter(0,'first');enter(1,'second');box.querySelectorAll('.olc-card')[2].querySelector('button').click();assert.equal(inputs()[2].value,'second','copy must use HOOK 1 of the same job');
 w.Storage.prototype.setItem=()=>{throw new w.DOMException('quota','QuotaExceededError');};enter(2,'third');fail=w.ctSubmissions.key('b');await assert.rejects(w.rbOrderListContent.capture()(),/offline/);assert.equal(writes.length,2);assert.equal(inputs()[1].value,'second');fail='';await w.rbOrderListContent.capture()();assert.equal(writes.length,3,'retry writes only failed additional job');
 assert.equal((await w.ctSubmissions.readOwn('a')).value.text,'first');assert.equal((await w.ctSubmissions.readOwn('b')).value.text,'second');assert.equal((await w.ctSubmissions.readOwn('c')).value.text,'third');
 enter(1,'local edit');const key=writes.find(p=>p.endsWith('/'+w.ctSubmissions.key('b')+'.json'));db[key].text='another device';versions[key]++;await assert.rejects(w.rbOrderListContent.capture()(),/อีกหน้า/);assert.equal(inputs()[1].value,'local edit');assert.equal(db[key].text,'another device');
 w.dispatchEvent(new w.Event('rb:content-updated'));assert.equal(inputs()[1].value,'local edit','source refresh preserves unsent content');
 const extra=box.querySelector('.rb-job-extra-host');box.querySelector('.rb-add-job-trigger').click();const third=extra.querySelector('[aria-label="ชื่องาน 3"]');third.value='First';third.dispatchEvent(new w.Event('change'));extra.querySelector('[aria-label="ลบชื่องาน 2"]').click();assert.equal(extra.querySelector('[aria-label="ชื่องาน 2"]').value,'First','removal renumbers without changing remaining data');
 assert.equal(w.ctHookHistory.matches(rows[1],[order],rows).length,1);const fallback=JSON.parse(JSON.stringify(order));delete fallback.contentBindings;assert.equal(w.ctHookHistory.matches(rows[2],[fallback],rows).length,1,'history fallback sees additional job');
 rows.push({id:'a-duplicate',brand:'A',name:'First',hook:'Same'});const ambiguous=JSON.parse(JSON.stringify(order));ambiguous.contentBindings=ambiguous.contentBindings.filter(b=>b.id!=='a');w.rbEmployeeJobDetails.mount(w.document.querySelector('main'),ambiguous,{rows:()=>rows,save:async()=>{}});await tick();assert.equal(w.document.querySelectorAll('.olc-card').length,2,'ambiguous primary hook must not reuse the additional job source ID');assert(w.document.querySelector('#rb-employee-job-details').textContent.includes('กรุณาเลือกรายการที่ชัดเจน'));
 w._rbUser={uid:'other',name:'TER',role:'graphic'};assert.equal(w.rbEmployeeJobDetails.read(order),null);assert.throws(()=>w.rbOrderListContent.capture(),/บัญชีเปลี่ยน/);
 console.log('PASS multiple job source IDs, same-job copy, quota, partial offline retry, concurrent edit, source refresh, removal, history and account boundaries');
 }finally{dom.window.close();}})().catch(e=>{console.error(e);process.exitCode=1});
