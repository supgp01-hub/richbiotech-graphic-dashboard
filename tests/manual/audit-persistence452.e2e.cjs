const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {installSecureAuthMock}=require('./secure-auth-mock');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:process.env.RB_TEST_BROWSER_CHANNEL||'chrome'});
 try{
 const context=await browser.newContext();
 const root=path.resolve(__dirname,'../..');
 const serveFiles=async route=>{
   const url=new URL(route.request().url());if(url.origin!=='http://127.0.0.1:8014')return route.abort();
   const file=path.resolve(root,'.'+url.pathname);if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});
   return route.fulfill({path:file});
 };
 await context.route('**/*',serveFiles);
 await installSecureAuthMock(context,{role:'audit',name:'QA Audit'});
 const db={qa_audit:{id:'GR_QA',name:'Audit regression',title:'Audit regression',product:'So Pink',type:'ยิงแอด',assignee:'DOM',deadline:'2026-09-14',status:'review',updatedAt:100,_syncRevision:1,submitLinks:['https://example.test/ad1','https://example.test/ad2'],fbName:'',camp1:'',camp2:''}};
 const writes=[];let etag=1;
 const ordersPattern=/firebaseio\.com\/orders(?:\/[^?]+)?\.json/;
 const serveOrders=async route=>{
   const req=route.request(),key=new URL(req.url()).pathname.split('/')[2]?.replace('.json','');
   if(req.method()==='OPTIONS')return route.fulfill({status:204});
   if(req.method()==='GET')return route.fulfill({status:200,headers:{ETag:'"'+etag+'"','access-control-allow-origin':'*','access-control-expose-headers':'ETag'},json:key?(db[key]||null):db});
   assert.equal(req.method(),'PUT');assert.ok(key);assert.equal(req.headers()['if-match'],'"'+etag+'"');
   db[key]=req.postDataJSON();etag++;writes.push(JSON.parse(JSON.stringify(db[key])));
   return route.fulfill({status:200,json:db[key]});
 };
 await context.route(ordersPattern,serveOrders);
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8014/index.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window._rbUser?.role==='audit'&&window.lpORD?.().some(o=>o.id==='GR_QA'));
 await page.evaluate(()=>window.openOM('qa_audit'));
 await page.locator('.rb-om-tab').filter({hasText:'ตรวจออดิต'}).click();
 await page.locator('#om-fbname').fill('QA Facebook');
 await page.locator('#om-pagename').fill('QA Page');
 await page.locator('#om-camp1').fill('QA Campaign 1');
 await page.locator('#om-camp2').fill('QA Campaign 2');
 await page.locator('#om-audit-btns button').last().click();
 await page.waitForFunction(()=>document.querySelector('.rb-om-footer')?.textContent.includes('ส่งงานกลับไปแก้ไขและบันทึกออนไลน์แล้ว')||document.querySelector('#rb-order-modal')?.style.display==='none');
 assert.equal(db.qa_audit.status,'revision');assert.equal(db.qa_audit.fbName,'QA Facebook');assert.equal(db.qa_audit.camp1,'QA Campaign 1');assert.equal(db.qa_audit.camp2,'QA Campaign 2');
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window._rbUser?.role==='audit'&&window.lpORD?.().some(o=>o.id==='GR_QA'));
 await page.evaluate(()=>window.openOM('qa_audit'));
 await page.locator('.rb-om-tab').filter({hasText:'ตรวจออดิต'}).click();
 assert.equal(await page.locator('#om-fbname').inputValue(),'QA Facebook');
 assert.equal(await page.locator('#om-camp1').inputValue(),'QA Campaign 1');
 // Another window updates metadata while this older modal stays open.
 db.qa_audit.fbName='New online Facebook';db.qa_audit.camp1='New online campaign';db.qa_audit.updatedAt+=1000;db.qa_audit._syncRevision++;etag++;
 await page.evaluate(row=>window.rbStorageResilience.storeOrders([{...row,_fbKey:'qa_audit'}]),db.qa_audit);
 await page.locator('#om-audit-btns button').last().click();
 await page.waitForFunction(()=>document.querySelector('.rb-om-footer')?.textContent.includes('ส่งงานกลับไปแก้ไขและบันทึกออนไลน์แล้ว')||document.querySelector('#rb-order-modal')?.style.display==='none');
 assert.equal(db.qa_audit.fbName,'New online Facebook','untouched stale modal fields must not overwrite another audit editor');
 assert.equal(db.qa_audit.camp1,'New online campaign');
 // A stale worker action must not undo a newly issued correction decision.
 db.qa_audit.status='inprogress';db.qa_audit.auditVersions=[];db.qa_audit.fbName='';db.qa_audit.updatedAt+=1000;etag++;
 const workerContext=await browser.newContext();
 await workerContext.route('**/*',serveFiles);await installSecureAuthMock(workerContext,{role:'graphic',name:'DOM'});await workerContext.route(ordersPattern,serveOrders);
 const worker=await workerContext.newPage();await worker.goto('http://127.0.0.1:8014/index.html',{waitUntil:'domcontentloaded'});
 await worker.waitForFunction(()=>window._rbUser?.role==='graphic'&&window.lpORD?.().some(o=>o.id==='GR_QA'));
 await worker.evaluate(()=>{window._ordViewMode='team';window.openOM('qa_audit');});
 db.qa_audit.status='revision';db.qa_audit.fbName='Audit account';db.qa_audit.auditVersions=[{jobId:'GR_QA',version:1,versionKey:'GR_QA:1',result:'issue',note:'Fix artwork',correctionRequestedAt:1234}];db.qa_audit.updatedAt+=1000;etag++;
 await worker.evaluate(row=>window.rbStorageResilience.storeOrders([{...row,_fbKey:'qa_audit'}]),db.qa_audit);
 const countBefore=writes.length;
 await worker.locator('#om-primary-btn').click();
 // The stale-state guard finishes after the asynchronous submission preflight.
 await worker.locator('.rb-om-footer').getByText(/สถานะงานเปลี่ยนแล้ว/).waitFor();
 assert.match(await worker.locator('.rb-om-footer').innerText(),/สถานะงานเปลี่ยนแล้ว/);
 assert.equal(writes.length,countBefore);assert.equal(db.qa_audit.status,'revision');
 // Reopen with current audit details and deliberately submit a new revision.
 await worker.reload({waitUntil:'domcontentloaded'});
 await worker.waitForFunction(()=>window._rbUser?.role==='graphic'&&window.lpORD?.().some(o=>o.id==='GR_QA'));
 await worker.evaluate(()=>{window._ordViewMode='team';window.openOM('qa_audit');});
 await worker.locator('#om-submitlinks-rows input').first().fill('https://example.test/corrected');
 await worker.locator('#om-primary-btn').click();
 await worker.waitForFunction(()=>document.querySelector('#rb-order-modal')?.style.display==='none'||document.querySelector('.rb-om-footer')?.textContent.includes('ออนไลน์เรียบร้อย')).catch(async e=>{console.log('worker feedback',await worker.locator('.rb-om-footer').innerText(),JSON.stringify(db.qa_audit).slice(0,1500));throw e;});
 assert.equal(db.qa_audit.status,'review');assert.equal(db.qa_audit.fbName,'Audit account');assert.equal(db.qa_audit.auditVersions[0].note,'Fix artwork');assert.equal(db.qa_audit.revisionSubmissions.at(-1).links[0],'https://example.test/corrected');
 assert.deepEqual(errors,[]);
 console.log('audit save/reload stateful Firebase ETag test passed',writes.length);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
