const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {installSecureAuthMock}=require('./secure-auth-mock');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:process.env.RB_TEST_BROWSER_CHANNEL||'chrome'});
 try{
 const root=path.resolve(__dirname,'../..'),db={qa_rounds:{id:'QA_ROUNDS',name:'Two HOOK review rounds',title:'Two HOOK review rounds',product:'So Pink',type:'ยิงแอด',assignee:'MOS',deadline:'2026-09-14',status:'inprogress',updatedAt:100,_syncRevision:1,submitLinks:['https://example.test/hook1','https://example.test/hook2'],reviewRounds:{version:1,origin:'tracked',complete:true,events:[]}}};
 let etag=1,puts=0,blocked=false;const errors=[],assets={};
 const serveFiles=async route=>{const url=new URL(route.request().url());if(url.origin!=='http://127.0.0.1:8014')return route.abort();const file=path.resolve(root,'.'+url.pathname);if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});return route.fulfill({path:file});};
 const serveOrders=async route=>{
  const req=route.request(),key=new URL(req.url()).pathname.split('/')[2]?.replace('.json','');
  if(blocked)return route.abort('internetdisconnected');
  if(req.method()==='OPTIONS')return route.fulfill({status:204});
  if(req.method()==='GET')return route.fulfill({status:200,headers:{ETag:'"'+etag+'"','access-control-allow-origin':'*','access-control-expose-headers':'ETag'},json:key?(db[key]||null):db});
  assert.equal(req.method(),'PUT');assert.equal(req.headers()['if-match'],'"'+etag+'"');db[key]=req.postDataJSON();etag++;puts++;return route.fulfill({status:200,json:db[key]});
 };
 const contextFor=async(role,name)=>{const c=await browser.newContext({viewport:{width:1440,height:1000}});await c.route('**/*',serveFiles);await installSecureAuthMock(c,{role,name});await c.route(/firebaseio\.com\/orders(?:\/[^?]+)?\.json/,serveOrders);await c.route(/firebaseio\.com\/order_assets\/[^?]+\.json/,async route=>{const key=new URL(route.request().url()).pathname;if(route.request().method()==='GET')return route.fulfill({json:assets[key]||null});assets[key]=route.request().postDataJSON();return route.fulfill({json:assets[key]});});const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));return p;};
 const worker=await contextFor('spec','MOSS'),audit=await contextFor('audit','QA Audit');
 async function load(p){await p.goto('http://127.0.0.1:8014/index.html',{waitUntil:'domcontentloaded'});await p.waitForFunction(expected=>window._rbUser&&window.lpORD?.().some(o=>o.id==='QA_ROUNDS'&&o.updatedAt===expected),db.qa_rounds.updatedAt);}
 async function open(p,mode){await p.evaluate(mode=>{window._ordViewMode=mode;window.openOM('qa_rounds');},mode);}
 async function saved(p){await p.waitForFunction(()=>document.querySelector('#rb-order-modal')?.style.display==='none'||/ออนไลน์เรียบร้อย|บันทึกออนไลน์แล้ว/.test(document.querySelector('.rb-om-footer')?.textContent||'')).catch(async e=>{console.log('save diagnostic',await p.locator('.rb-om-footer').innerText(),db.qa_rounds.status);throw e;});}
 async function label(p){return p.evaluate(()=>window.rbReviewRounds.label(window.lpORD().find(o=>o.id==='QA_ROUNDS')));}
 async function returnForCorrection(){await load(audit);await open(audit,'audit');await audit.locator('.rb-om-tab').filter({hasText:'ตรวจออดิต'}).click();await audit.locator('#om-fbname').fill('QA Facebook');await audit.locator('#om-camp1').fill('QA Campaign 1');await audit.locator('#om-camp2').fill('QA Campaign 2');for(let i=0;i<2;i++){const result=audit.locator('#rb-audit-version-workflow .rb-av-result-input').nth(i);if(await result.inputValue()!=='issue'){await result.click();await audit.locator('#rb-dd-popover .rb-dd-option').filter({hasText:'ต้องแก้ไข'}).click();await audit.waitForFunction(i=>document.querySelectorAll('#rb-audit-version-workflow .rb-av-result-input')[i]?.value==='issue',i);}await audit.locator('#rb-audit-version-workflow .rb-av-note-input').nth(i).fill('Fix HOOK '+(i+1));}await audit.locator('#om-audit-btns button').last().click();await saved(audit);assert.equal(db.qa_rounds.status,'revision');}
 for(const name of ['MOS','มอส']){const alias=await contextFor('spec',name);await load(alias);await open(alias,'all');assert.equal(await alias.locator('#om-primary-btn').innerText(),'ส่งงาน',name+' must submit own assigned work');await alias.context().close();}
 const other=await contextFor('spec','TER');await load(other);await open(other,'all');assert.match(await other.locator('#om-primary-btn').innerText(),/บันทึกงาน/,'another assignee remains in assignment editing mode');await other.context().close();
 await load(worker);await open(worker,'all');assert.equal(await worker.locator('#om-primary-btn').innerText(),'ส่งงาน');await worker.locator('.rb-om-tab').filter({hasText:'ส่งงาน/สรุปงาน'}).click();await worker.locator('#om-primary-btn').click();await saved(worker);
 assert.equal(db.qa_rounds.status,'review');assert.equal(await label(worker),'รอตรวจครั้งที่ 1');assert.equal(db.qa_rounds.reviewRounds.events.filter(e=>e.kind==='submitted').length,1);
 await returnForCorrection();assert.equal(await label(audit),'ต้องแก้ไข • รอบ 1');
 await load(worker);await open(worker,'all');await worker.locator('#om-submitlinks-rows input').first().fill('https://example.test/corrected1');await worker.locator('#om-primary-btn').click();await saved(worker);
 assert.equal(db.qa_rounds.status,'review');assert.equal(await label(worker),'รอตรวจครั้งที่ 2');assert.equal(db.qa_rounds.reviewRounds.events.filter(e=>e.kind==='resubmitted').length,1);assert.equal(db.qa_rounds.fbName,'QA Facebook');assert.equal(db.qa_rounds.camp2,'QA Campaign 2');
 const firstCycle=db.qa_rounds.revisionSubmissions[0].cycleId;assert.ok(firstCycle);
 await returnForCorrection();assert.equal(await label(audit),'ต้องแก้ไข • รอบ 2');
 // Use the per-VER upload/submit path for the second cycle. Two images and
 // two HOOKs belong to one review round, including a repeated button click.
 await load(worker);await open(worker,'all');await worker.locator('.rb-om-tab').filter({hasText:'ส่งงาน/สรุปงาน'}).click();
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aAZkAAAAASUVORK5CYII=','base64');
 for(let i=0;i<2;i++){await worker.locator('#rb-team-version-workflow .rb-av-upload.is-fix input').nth(i).setInputFiles({name:'fix.png',mimeType:'image/png',buffer:png});await worker.waitForFunction(i=>document.querySelector('#rb-team-version-workflow')?._rbState?.[i]?.fixImages?.length>0,i).catch(async e=>{console.log('upload diagnostic',i,errors,await worker.evaluate(()=>document.querySelector('#rb-team-version-workflow')?._rbState?.map(s=>({version:s.version,images:s.fixImages?.length,result:s.result}))),await worker.locator('#rb-team-version-workflow').innerText());throw e;});await worker.locator('#rb-team-version-workflow .rb-av-fix-note').nth(i).fill('Corrected HOOK '+(i+1));}
 await worker.evaluate(()=>{window.__qaOldSubmit=document.querySelector('#rb-team-version-workflow .rb-av-employee-save');});
 await worker.locator('#rb-team-version-workflow .rb-av-employee-save').click();
 await worker.waitForFunction(()=>document.querySelector('#rb-team-version-workflow .rb-av-save-message')?.textContent.includes('ส่งกลับให้ Audit แล้ว'));
 assert.equal(db.qa_rounds.status,'review');assert.equal(await label(worker),'รอตรวจครั้งที่ 3');assert.equal(db.qa_rounds.revisionSubmissions.length,2);assert.notEqual(db.qa_rounds.revisionSubmissions[1].cycleId,firstCycle);
 const beforeRepeat=puts;await worker.evaluate(()=>window.__qaOldSubmit.click());assert.equal(puts,beforeRepeat);assert.equal(await worker.locator('#rb-team-version-workflow .rb-av-employee-save').count(),0,'submitted cycle no longer has an active submit button');
 await load(audit);await audit.locator('#sidebar button').filter({hasText:'Graphic'}).click();await audit.locator('.gsnav-btn').filter({hasText:'สั่งงาน'}).click();
 const tableRow=audit.locator('.ord-table tbody tr').filter({hasText:'QA_ROUNDS'});await tableRow.waitFor();assert.match(await tableRow.innerText(),/รอตรวจครั้งที่ 3/);assert.match(await tableRow.locator('.rb-round-count-cell').innerText(),/2 ครั้ง/);
 await tableRow.locator('.rb-round-history-button').click();const history=audit.locator('dialog.rb-round-history');assert.equal(await history.locator('li').count(),5);assert.match(await history.innerText(),/พนักงานส่งแก้ครั้งที่ 2/);
 for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){await audit.setViewportSize(viewport);const box=await history.boundingBox();assert.ok(Math.abs(box.x+box.width/2-viewport.width/2)<2,'history is horizontally centered');assert.ok(Math.abs(box.y+box.height/2-viewport.height/2)<2,'history is vertically centered');assert.ok(box.x>=0&&box.y>=0&&box.width<=viewport.width&&box.height<=viewport.height,'history and close control fit the viewport');}
 await audit.setViewportSize({width:1440,height:1000});await history.locator('header button').click();
 await open(audit,'audit');await audit.locator('.rb-om-tab').filter({hasText:'ตรวจออดิต'}).click();await audit.locator('#om-audit-btns button').first().click();await saved(audit);assert.equal(db.qa_rounds.status,'done');
 await load(audit);assert.equal(await label(audit),'เสร็จสมบูรณ์');assert.equal(await audit.evaluate(()=>window.rbReviewRounds.summary(window.lpORD()[0]).corrections),2);
 assert.deepEqual(errors,[]);console.log('MOSS Specialist all-work workflow: initial submission, two correction cycles, 2 HOOKs, both submit paths, duplicate guard, table/history, approval and reload passed',puts);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
