const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {installSecureAuthMock}=require('./secure-auth-mock');
(async()=>{const browser=await chromium.launch({headless:true,channel:process.env.RB_TEST_BROWSER_CHANNEL||'chrome'});try{
 const root=path.resolve(__dirname,'../..'),origin='http://127.0.0.1:8014',db={work:{id:'GR_QA',name:'Cross device QA',product:'So Pink',type:'ยิงแอด',status:'inprogress',assignee:'DOM',updatedAt:100,_syncRevision:1,submitLinks:['https://example.test/work'],auditError:'remove me'}};
 for(let i=0;i<106;i++)db['other'+i]={id:'QA_OTHER'+i,status:'done',assignee:'JAM',updatedAt:100,_syncRevision:1};
 const currentBuild=fs.readFileSync(path.join(root,'index.html'),'utf8').match(/name="rb-build" content="([^"]+)"/)[1];
 let etag=1,hold=false,release,releaseBuild=currentBuild;const writes=[],errors=[];
 const contexts=[];
 async function device(role,name){const ctx=await browser.newContext(process.env.RB_TEST_MOBILE?{viewport:{width:390,height:844},isMobile:true,hasTouch:true}:{});contexts.push(ctx);
  await ctx.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin!==origin)return route.abort();if(u.pathname==='/release.json')return route.fulfill({json:{build:releaseBuild}});if(u.pathname==='/index.html')return route.fulfill({contentType:'text/html',body:fs.readFileSync(path.join(root,'index.html'),'utf8').replace('content="'+currentBuild+'"','content="'+releaseBuild+'"')});const f=path.resolve(root,'.'+u.pathname);return f.startsWith(root+path.sep)&&fs.existsSync(f)?route.fulfill({path:f}):route.fulfill({status:404,body:''});});
  await installSecureAuthMock(ctx,{role,name});
  if(role==='graphic')await ctx.addInitScript(()=>{if(!localStorage.getItem('qa-legacy-queue-loaded')){localStorage.setItem('qa-legacy-queue-loaded','1');localStorage.setItem('rb_order_write_queue_v1',JSON.stringify(Array.from({length:106},(_,i)=>({token:'legacy-'+i,path:'/orders/other'+i,method:'PATCH',data:{updatedAt:1,_syncRevision:0},conflict:true}))));}});
  await ctx.route(/firebaseio\.com\/orders(?:\/[^?]+)?\.json/,async route=>{const r=route.request(),k=new URL(r.url()).pathname.split('/')[2]?.replace('.json','');if(r.method()==='GET')return route.fulfill({headers:{ETag:'"'+etag+'"','access-control-expose-headers':'ETag'},json:k?db[k]||null:db});
   assert.equal(r.method(),'PUT');if(r.headers()['if-match']!=='"'+etag+'"')return route.fulfill({status:412,body:''});
   db[k]=r.postDataJSON();etag++;writes.push(k);if(hold){hold=false;await new Promise(r=>release=r);}return route.fulfill({json:db[k]});});
  const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/index.html',{waitUntil:'domcontentloaded'});await page.waitForFunction(role=>window.lpORD?.().some(o=>o.id==='GR_QA')&&window.rbOnlineConsistency&&window._rbUser?.role===role,role);return{ctx,page};
 }
 const worker=await device('graphic','DOM'),audit=await device('audit','QA Audit');
 await worker.page.waitForFunction(()=>window.rbOrderSync.pendingCount()===0);assert.equal(await worker.page.evaluate(()=>JSON.parse(localStorage.getItem('rb_order_conflict_archive_v1')).length),106,'metadata-only legacy conflicts are backed up before removal');
 await worker.page.evaluate(()=>{window._ordViewMode='team';window.openOM('work');});
 await worker.ctx.setOffline(true);await worker.page.locator('#om-primary-btn').click();
 await worker.page.waitForFunction(()=>window.rbOrderSync.pendingCount()>0).catch(async e=>{console.log('offline feedback',await worker.page.locator('.rb-om-footer').innerText());throw e;});
 assert.equal(db.work.status,'inprogress','offline submission is not an online acknowledgement');
 assert.equal(await audit.page.evaluate(()=>window.lpORD().find(o=>o.id==='GR_QA').status),'inprogress');
 await worker.ctx.setOffline(false);await worker.page.evaluate(()=>{window.dispatchEvent(new Event('online'));window.rbOrderSync.flush();});
 await worker.page.waitForFunction(()=>window.rbOrderSync.pendingCount()===0,{},{timeout:20000});assert.equal(db.work.status,'review');
 // Automatic polling must update an entirely separate browser context.
 await audit.page.waitForFunction(()=>window.lpORD().find(o=>o.id==='GR_QA').status==='review',{},{timeout:50000});
 await audit.page.evaluate(()=>window.openOM('work'));await audit.page.locator('.rb-om-tab').filter({hasText:'ตรวจออดิต'}).click();await audit.page.locator('#om-fbname').fill('QA audited account');await audit.page.locator('#om-camp1').fill('QA campaign');await audit.page.locator('#om-audit-btns button').last().click();
 await audit.page.waitForFunction(()=>window.rbOrderSync.pendingCount()===0&&window.lpORD().find(o=>o.id==='GR_QA').status==='revision');assert.equal(db.work.status,'revision');
 await worker.page.waitForFunction(()=>window.lpORD().find(o=>o.id==='GR_QA').status==='revision',{},{timeout:50000});
 assert.equal(await worker.page.evaluate(()=>window.lpORD().find(o=>o.id==='GR_QA').fbName),'QA audited account');
 assert(writes.every(k=>k==='work'),'106 unrelated rows must never enter write queue');
 // Repeated edits while an earlier request awaits acknowledgement must rebase.
 hold=true;await audit.page.evaluate(()=>{const rows=lpORD();rows.find(o=>o.id==='GR_QA').camp1='first';window.qaFirst=spORD(rows);});
 while(!release)await new Promise(r=>setTimeout(r,50));
 await audit.page.evaluate(()=>{const rows=lpORD();rows.find(o=>o.id==='GR_QA').camp1='second';window.qaSecond=spORD(rows);});release();
 await audit.page.waitForFunction(()=>window.rbOrderSync.pendingCount()===0,{},{timeout:20000});assert.equal(db.work.camp1,'second');
 // Server-side clears propagate and remain cleared after a reload.
 delete db.work.auditError;db.work.updatedAt++;db.work._syncRevision++;etag++;
 await worker.page.evaluate(()=>window.fbRefreshOrders());await worker.page.waitForFunction(()=>window.lpORD().find(o=>o.id==='GR_QA').auditError===undefined);
 await worker.page.reload({waitUntil:'domcontentloaded'});await worker.page.waitForFunction(()=>window.lpORD?.().some(o=>o.id==='GR_QA'));assert.equal(await worker.page.evaluate(()=>window.lpORD().find(o=>o.id==='GR_QA').status),'revision');
 // New release waits for the open edited form; never interrupts typing.
 await worker.page.evaluate(()=>{window._ordViewMode='team';window.openOM('work');localStorage.setItem('rb_order_write_queue_v1',JSON.stringify([{token:'qa-protected-conflict',path:'/orders/work',method:'PATCH',data:{status:'done'},conflict:true}]));});releaseBuild='fix'+(Number(currentBuild.slice(3))+1);await worker.page.evaluate(()=>window.rbReleaseUpdate.check());await worker.page.locator('#rb-release-update').waitFor();assert(!worker.page.url().includes('__rb_release'));
 await worker.page.evaluate(()=>window.closeOM(true));await worker.page.waitForURL('**__rb_release='+releaseBuild,{timeout:15000});
 await worker.page.waitForFunction(()=>window.rbOrderSync?.queue().some(op=>op.token==='qa-protected-conflict'));
 assert.equal(db.work.status,'revision','updating the client must not force a conflict over the server');
 assert.deepEqual(errors,[]);console.log('PASS independent employee/audit sessions: offline retry, automatic cross-device refresh, 106 unrelated jobs, concurrent edits, server clears, reload and update deferral');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
