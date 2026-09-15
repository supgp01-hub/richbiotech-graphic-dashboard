const fs=require('fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const dom=new JSDOM('<div class="ct-wrap"><div class="ct-actions"></div><div class="ct-table-container"><table class="ct-table"><thead><tr></tr></thead><tbody id="rows"></tbody></table></div></div>',{url:'https://example.test',runScripts:'outside-only'}),w=dom.window;
w._rbUser={uid:'dom',name:'DOM',role:'graphic'};w.AbortController=AbortController;w.confirm=()=>true;
const rows=[{id:'hook1',brand:'So Pink',episode:'ทดสอบ',ready:'หนึ่ง'},{id:'hook2',brand:'So Pink',episode:'ทดสอบ',ready:'สอง'}];
w.ctContentRows=()=>rows;w.ctProductOwners=()=>({'So Pink':'DOM JAM'});w.ctProductList=()=>[];
const records={},versions={};let offline=false,putCount=0;
w.rbFirebaseAuth={fetch:async(url,o={})=>{
 const path=new URL(url).pathname.replace(/^\//,'').replace(/\.json$/,'');
 if(path==='content_product_catalog_v1')return new Response('null');
 if(o.method==='PUT'){
  if(offline)throw Error('offline');if(o.headers['if-match']!=='v'+(versions[path]||0))return new Response('{}',{status:412});
  const v=JSON.parse(o.body);v.updatedAt=1000+(++putCount);records[path]=v;versions[path]=(versions[path]||0)+1;return new Response(JSON.stringify(v));
 }
 let value=records[path];if(path==='content_submissions_v1/dom')value=Object.fromEntries(Object.entries(records).filter(([k])=>k.startsWith(path+'/')).map(([k,v])=>[k.split('/').pop(),v]));
 if(path==='content_submissions_v1')value={dom:Object.fromEntries(Object.entries(records).filter(([k])=>k.startsWith(path+'/dom/')).map(([k,v])=>[k.split('/').pop(),v]))};
 return new Response(JSON.stringify(value||null),{headers:{ETag:'v'+(versions[path]||0)}});
}};
for(const file of ['content-permissions-v1','content-submissions-v1','content-grouped-v1'])w.eval(fs.readFileSync('snippets/'+file+'.js','utf8'));
w.ctRender=function(){w.ctSubmissions.mount();w.ctGrouped.mount();w.document.getElementById('rows').innerHTML=rows.map((r,i)=>w.ctGrouped.row(r,i+1)).join('');};
const tick=()=>new Promise(r=>setTimeout(r,20));
(async()=>{
 let base=await w.ctSubmissions.readOwn('hook1');base=await w.ctSubmissions.saveOwn('hook1','แรก',base);
 base=await w.ctSubmissions.saveOwn('hook1','สอง',base);assert.equal(base.value.history.v_1.text,'แรก');assert.equal(base.value.revision,2);
 const count=putCount;await w.ctSubmissions.saveOwn('hook1','สอง',base);assert.equal(putCount,count,'retry is idempotent');
 w.ctRender();w.document.querySelector('[data-ctg-toggle="hook1"]').click();await tick();
 assert.equal(w.document.querySelectorAll('[data-ctg-edit]').length,0);assert(!w.document.querySelector('thead').textContent.includes('จัดการ'));
 assert(w.document.querySelector('[data-cts-row="hook1"]').textContent.includes('แรก'),'history is in the exact cell');
 w.document.querySelector('[data-content-id="hook1"]').click();await tick();
 let area=w.document.querySelector('#cts-text');assert(area);assert.equal(area.closest('[data-cts-row]').dataset.ctsRow,'hook1');
 area.value='ร่างยังไม่บันทึก';area.dispatchEvent(new w.Event('input'));area.focus();
 await w.ctSubmissions.refresh();assert.strictEqual(w.document.querySelector('#cts-text'),area);assert.equal(area.value,'ร่างยังไม่บันทึก');assert.strictEqual(w.document.activeElement,area);
 offline=true;w.document.querySelector('.cts-save').click();await tick();assert.equal(area.value,'ร่างยังไม่บันทึก');assert(w.document.querySelector('.cts-status').textContent.includes('offline'));
 offline=false;w.document.querySelector('.cts-save').click();await tick();assert(w.document.querySelector('.cts-status').textContent.includes('บันทึกออนไลน์แล้ว'));assert.equal(w.ctSubmissions.entries('hook1')[0].history.v_2.text,'สอง');
 const stale=await w.ctSubmissions.readOwn('hook1');await w.ctSubmissions.saveOwn('hook1','จากอีกหน้าต่าง',stale);
 area.value='ร่างชนกัน';area.dispatchEvent(new w.Event('input'));w.document.querySelector('.cts-save').click();await tick();assert.equal(area.value,'ร่างชนกัน');assert(w.document.querySelector('.cts-status').textContent.includes('อีกหน้า'));
 assert.equal(w.ctSubmissions.entries('hook2').length,0,'separate hook untouched');
 for(const role of ['sup','spec','audit','graphic','ads']){w._rbUser={uid:'dom',name:'DOM',role};w.dispatchEvent(new w.Event('rb:auth-ready'));w.ctRender();assert.equal(w.document.querySelectorAll('[data-ctg-edit]').length,['sup','spec','audit'].includes(role)?2:0,role);}
 w._rbUser=null;w.dispatchEvent(new w.Event('rb:auth-cleared'));assert.equal(w.document.querySelector('#cts-text'),null);assert.equal(w.ctCanManage(),false);
 console.log('PASS: inline current/history, retained draft and focus on refresh, offline retry, two-page conflict, HOOK isolation, role visibility and auth cleanup');
 dom.window.close();
})().catch(e=>{console.error(e);dom.window.close();process.exitCode=1});
