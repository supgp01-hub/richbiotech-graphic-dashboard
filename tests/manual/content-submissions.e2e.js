// NODE_PATH points to a local installation of jsdom. No production requests.
const {JSDOM}=require('jsdom'),fs=require('node:fs'),assert=require('node:assert/strict'),test=require('node:test');
const html=fs.readFileSync('index.html','utf8'),source=fs.readFileSync('snippets/content-submissions-v1.js','utf8');
const start=html.lastIndexOf('(function(){',html.indexOf("var CT_KEY='rb_olympplus_v1'")),end=html.indexOf('window._rbTogSB',start);
const tick=()=>new Promise(r=>setTimeout(r,10));
async function fixture(role='graphic'){
 const dom=new JSDOM('<div class="gsp" data-sub="links" id="panel"></div>',{url:'https://test.invalid',runScripts:'outside-only'}),w=dom.window;
 w._rbUser={uid:'nune',name:'NUNE',role};w.CT_EMBED=[{id:'ct_1',brand:'Liv CARE',episode:'งานตัวอย่าง',ready:'Hook',script:'สคริป',release:'pending'}];
 w.confirm=()=>true;w.alert=()=>{};let fail=false,clock=1788951000000;
 const texts={};const calls=[],versions={};
 w.rbFirebaseAuth={fetch:async(url,opts)=>{let path=new URL(url).pathname.slice(1,-5);calls.push({path,...opts});
  if(opts.method==='PUT'){
   if(fail)throw new Error('offline');if(opts.headers['if-match']!==(versions[path]||'"null_etag"'))return {ok:false,status:412};
   let value=JSON.parse(opts.body);value.updatedAt=++clock;texts[path]=value;versions[path]='"v'+clock+'"';return {ok:true,json:async()=>value,headers:{get:()=>versions[path]}};
  }
  let value=texts[path]||null;
  if(path==='content_submissions_v1/nune')value=Object.fromEntries(Object.entries(texts).filter(([k])=>k.startsWith(path+'/')).map(([k,v])=>[k.split('/').pop(),v]));
  if(path==='content_submissions_v1')value=Object.fromEntries(['nune','jam'].map(uid=>[uid,Object.fromEntries(Object.entries(texts).filter(([k])=>k.startsWith(path+'/'+uid+'/')).map(([k,v])=>[k.split('/').pop(),v]))]));
  if(path==='content_product_catalog_v1')value=Object.fromEntries(Object.entries(texts).filter(([k])=>k.startsWith(path+'/')).map(([k,v])=>[k.split('/').pop(),v]));
  return {ok:true,json:async()=>value,headers:{get:()=>versions[path]||'"null_etag"'}};
 }};
 w.eval(html.slice(start,end));w.eval(source);w.initLinksPanel(w.document.getElementById('panel'));await tick();
 return {w,dom,texts,calls,versions,setFail:x=>{fail=x;},seed(uid,text){texts['content_submissions_v1/'+uid+'/'+w.ctSubmissions.key('ct_1')]={rowId:'ct_1',ownerUid:uid,ownerName:uid.toUpperCase(),text,updatedAt:clock};}};
}
test('text saves with server time, reload persists, failed save keeps draft and no shared row changes',async()=>{
 const f=await fixture(),{w}=f,d=w.document;d.querySelector('[data-content-id]').click();await tick();
 let area=d.querySelector('#cts-text');assert.ok(area);assert.ok(d.querySelector('.ct-wrap > .cts-inline'));assert.equal(d.querySelector('.cts-inline [role="dialog"]'),null);area.value='รายการหนึ่ง\nรายการสอง';area.dispatchEvent(new w.Event('input'));
 f.setFail(true);d.querySelector('.cts-save').click();await tick();assert.equal(d.querySelector('#cts-text').value,area.value);assert.match(d.querySelector('.cts-status').textContent,/offline/);
 f.setFail(false);d.querySelector('.cts-save').click();await tick();assert.equal(d.querySelector('.cts-overlay'),null);
 assert.match(d.querySelector('#ct-tbody').textContent,/2569/);assert.match(d.querySelector('.cts-text-preview').textContent,/รายการหนึ่ง/);assert.equal(w.ctContentRows()[0].release,'pending');assert.equal(w.ctContentRows()[0].text,undefined);
 assert.ok(f.calls.filter(c=>c.method==='PUT').every(c=>c.path.startsWith('content_submissions_v1/nune/')));
 d.querySelector('[data-content-id]').click();await tick();assert.equal(d.querySelector('#cts-text').value,'รายการหนึ่ง\nรายการสอง');
 // Opening another window changed the version: stale write must not overwrite it.
 let put=f.calls.find(c=>c.method==='PUT');f.versions[put.path]='"external"';d.querySelector('.cts-save').click();await tick();assert.match(d.querySelector('.cts-status').textContent,/อีกหน้าต่าง/);assert.ok(d.querySelector('#cts-text'));f.dom.window.close();
});
test('regular staff fetch only own subtree; Supervisor and Audit see all with escaped text',async()=>{
 for(const role of ['graphic','spec','sup','audit']){
  const f=await fixture(role),{w}=f;f.seed('jam','<img src=x onerror=alert(1)>');w.document.querySelector('[data-content-id]').click();await tick();
  const privileged=['sup','audit'].includes(role);assert.equal(w.document.querySelectorAll('.cts-others article').length,privileged?1:0);assert.equal(w.document.querySelectorAll('.cts-others img').length,0);
  assert.equal(f.calls.some(c=>c.path==='content_submissions_v1'),privileged);
  assert.equal(w.document.getElementById('cts-manage').hidden,role!=='sup');
  w._rbUser={uid:'another',name:'OTHER',role:'graphic'};w.dispatchEvent(new w.CustomEvent('rb:auth-ready'));await tick();assert.equal(w.document.querySelector('.cts-overlay'),null);assert.equal(w.ctSubmissions.entries('ct_1').length,0);f.dom.window.close();
 }
});
test('Supervisor adds products and multiple caretakers; new products work in filter and form',async()=>{
 const f=await fixture('sup'),{w}=f,d=w.document;d.getElementById('cts-manage').click();await tick();d.querySelector('.cts-name').value='New Brand';d.querySelector('.cts-owners').value='NUNE, JAM, FUTURE';d.querySelector('.cts-save').click();await tick();
 assert.ok(w.ctProductList().includes('New Brand'));assert.equal(w.ctProductOwners()['New Brand'],'NUNE JAM FUTURE');assert.ok(d.querySelector('[data-b="New Brand"]'));assert.ok([...d.querySelector('#ct-bulk-brand-sel').options].some(o=>o.value==='New Brand'));
 d.querySelector('[data-b="New Brand"]').click();assert.match(d.querySelector('thead').textContent,/FUTURE/);w.ctModal(null);assert.ok([...d.querySelector('#ctm-brand').options].some(o=>o.value==='New Brand'));
 f.dom.window.close();
});
test('repeated unchanged refreshes preserve table nodes; edits and user changes still update',async()=>{
 const f=await fixture(),{w}=f,d=w.document,body=d.querySelector('#ct-tbody');
 const first=body.firstElementChild;let mutations=0;const observer=new w.MutationObserver(ms=>{mutations+=ms.length});observer.observe(body,{childList:true});
 const start=Date.now();for(let i=0;i<100;i++)w.ctRender();await tick();assert.equal(body.firstElementChild,first);assert.equal(mutations,0);
 console.log('100 unchanged Content renders:',Date.now()-start,'ms; table replacements:',mutations);
 w._ctCloudRows=[{...w.ctContentRows()[0],episode:'เปลี่ยนชื่องาน'}];w.ctRender();assert.notEqual(body.firstElementChild,first);assert.match(body.textContent,/เปลี่ยนชื่องาน/);
 const changed=body.firstElementChild;w._rbUser={uid:'jam',name:'JAM',role:'graphic'};w.ctRender();assert.notEqual(body.firstElementChild,changed);
 observer.disconnect();f.dom.window.close();
});
