const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const {installSecureAuthMock}=require('./secure-auth-mock');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:process.env.RB_TEST_BROWSER_CHANNEL||'chrome'}),root=path.resolve(__dirname,'../..');
 const rows=[{id:'qa-hook-1',brand:'So Pink',episode:'ทดสอบออนไลน์',ready:'HOOK หนึ่ง',script:'https://example.test/script'},{id:'qa-hook-2',brand:'So Pink',episode:'ทดสอบออนไลน์',ready:'HOOK สอง',script:'https://example.test/script'}];
 const records={},versions={};let offline=false,writes=0;
 async function create(role,name){
  const ctx=await browser.newContext({viewport:{width:1440,height:1000}});
  await ctx.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!=='http://127.0.0.1:8014')return r.abort();const f=path.resolve(root,'.'+u.pathname);return f.startsWith(root+path.sep)&&fs.existsSync(f)?r.fulfill({path:f}):r.fulfill({status:404,body:''});});
  await installSecureAuthMock(ctx,{role,name});
  await ctx.route(/firebaseio\.com\/content_tracker_v2\.json/,r=>r.fulfill({status:200,headers:{ETag:'"master"'},json:{items:rows}}));
  await ctx.route(/firebaseio\.com\/content_submissions_v1/,async r=>{
   const q=r.request(),p=new URL(q.url()).pathname.replace(/^\//,'').replace(/\.json$/,'');
   if(q.method()==='PUT'){if(offline)return r.abort();assert.equal(q.headers()['if-match'],'"'+(versions[p]||0)+'"');const v=q.postDataJSON();v.updatedAt=Date.now();records[p]=v;versions[p]=(versions[p]||0)+1;writes++;return r.fulfill({status:200,json:v});}
   let data=records[p]||null;
   if(p==='content_submissions_v1/qa-secure-user')data=Object.fromEntries(Object.entries(records).map(([k,v])=>[k.split('/').pop(),v]));
   if(p==='content_submissions_v1')data={'qa-secure-user':Object.fromEntries(Object.entries(records).map(([k,v])=>[k.split('/').pop(),v]))};
   return r.fulfill({status:200,headers:{ETag:'"'+(versions[p]||0)+'"','access-control-expose-headers':'ETag'},json:data});
  });
  const page=await ctx.newPage();await page.goto('http://127.0.0.1:8014/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(role=>window._rbUser?.role===role&&window.ctSubmissions&&window.ctGrouped,role);
  await page.locator('#sidebar button').filter({hasText:'Graphic'}).click();
  await page.locator('.gsnav-btn').filter({hasText:'รวมลิงก์'}).click();
  await page.waitForSelector('[data-ctg-toggle="qa-hook-1"]');return {ctx,page};
 }
 try{
  const staff=await create('graphic','DOM'),sup=await create('sup','VIEW');
  const employee=staff.page,reviewer=sup.page;
  assert.equal(await employee.locator('[data-ctg-edit]').count(),0);assert.equal(await reviewer.locator('[data-ctg-edit]').count(),2);
  await employee.evaluate(()=>{window.ctModal(null);window.ctEdit('qa-hook-1');window.ctDel('qa-hook-1');window.ctImportModal();window.ctImportCommit();window.ctImportUndoLast();});
  assert.equal(await employee.locator('.ct-modal-bg,#ct-del-ov,#cti-bg').count(),0);
  assert.equal(await employee.evaluate(()=>window.ctPersistContent([{id:'forbidden'}])),false);
  // The same component used by the receive-work form saves both HOOKs.
  await employee.evaluate(()=>{var host=document.createElement('div');host.id='qa-order-content';document.body.appendChild(host);window.qaContent=window.rbOrderListContent.mount(host,{id:'QA',product:'So Pink'},()=>[{slot:1,id:'qa-hook-1',hook:'HOOK หนึ่ง'},{slot:2,id:'qa-hook-2',hook:'HOOK สอง'}]);});
  await employee.waitForFunction(()=>Array.from(document.querySelectorAll('#qa-order-content [role="status"]')).every(e=>e.textContent.includes('ยังไม่มี')));
  await employee.getByLabel('List Content ของ HOOK 1',{exact:true}).fill('ข้อความจากหน้ารับงาน หนึ่ง');await employee.getByLabel('List Content ของ HOOK 2',{exact:true}).fill('ข้อความจากหน้ารับงาน สอง');
  await employee.evaluate(()=>window.qaContent.capture()());assert.equal(writes,2);
  await reviewer.evaluate(()=>window.ctSubmissions.refresh());await reviewer.locator('[data-ctg-toggle="qa-hook-1"]').click();
  const readCell=reviewer.locator('[data-cts-row="qa-hook-1"][data-cts-owner="qa-secure-user"]');assert((await readCell.innerText()).includes('ข้อความจากหน้ารับงาน หนึ่ง'));
  await employee.evaluate(()=>document.querySelector('#qa-order-content').remove());
  await employee.locator('[data-ctg-toggle="qa-hook-1"]').click();await employee.locator('[data-content-id="qa-hook-1"]').click();
  await employee.locator('#cts-text').fill('ข้อความแก้จากตาราง');await employee.evaluate(()=>window.ctSubmissions.refresh());assert.equal(await employee.locator('#cts-text').inputValue(),'ข้อความแก้จากตาราง');
  assert.equal(await employee.locator('[data-cts-row="qa-hook-1"] #cts-text').count(),1);
  offline=true;await employee.locator('.cts-save').click();await employee.waitForFunction(()=>!document.querySelector('.cts-save').disabled);assert.equal(await employee.locator('#cts-text').inputValue(),'ข้อความแก้จากตาราง');
  offline=false;await employee.locator('.cts-save').click();await employee.waitForFunction(()=>document.querySelector('.cts-status').textContent.includes('บันทึกออนไลน์แล้ว'));
  await reviewer.evaluate(()=>window.ctSubmissions.refresh());assert((await readCell.innerText()).includes('ข้อความแก้จากตาราง'));assert((await readCell.innerText()).includes('ข้อความจากหน้ารับงาน หนึ่ง'));
  await employee.locator('.cts-close').click();await employee.reload({waitUntil:'domcontentloaded'});await employee.waitForFunction(()=>window._rbUser?.role==='graphic'&&window.ctSubmissions);
  const reloaded=await employee.evaluate(()=>window.ctSubmissions.readOwn('qa-hook-1'));assert.equal(reloaded.value.text,'ข้อความแก้จากตาราง');assert.equal(reloaded.value.history.v_1.text,'ข้อความจากหน้ารับงาน หนึ่ง');
  const untouched=await employee.evaluate(()=>window.ctSubmissions.readOwn('qa-hook-2'));assert.equal(untouched.value.text,'ข้อความจากหน้ารับงาน สอง');
  await readCell.scrollIntoViewIfNeeded();await reviewer.screenshot({path:path.resolve(root,'../content-inline460-browser.png'),fullPage:false});
  console.log('PASS: separate staff/supervisor contexts, receive-work two HOOKs, inline save/history, offline retry, no employee master entry points, and fresh-page persistence');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
