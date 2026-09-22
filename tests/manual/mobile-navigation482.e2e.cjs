const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {installSecureAuthMock}=require('./secure-auth-mock');
(async()=>{const browser=await chromium.launch({headless:true,channel:process.env.RB_TEST_BROWSER_CHANNEL||'chrome'});try{
 const root=path.resolve(__dirname,'../..'),errors=[];
 for(const role of ['sup','graphic','spec','audit','ads']){
  const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await ctx.route('**/*',r=>{const u=new URL(r.request().url()),f=path.resolve(root,'.'+u.pathname);return u.origin==='http://127.0.0.1:8014'&&f.startsWith(root+path.sep)&&fs.existsSync(f)?r.fulfill({path:f}):r.abort();});
  await installSecureAuthMock(ctx,{role,name:role==='graphic'?'JAM':'View',orders:[{id:'GR900',name:'งานคำถามคำตอบ WOLF+',assignee:'JAM',status:'review',type:'ยิงแอด',deadline:'2026-09-25'}]});
  await ctx.route(/firebaseio\.com\/commission_source_snapshot_v1\.json/,r=>r.fulfill({json:{items:[{employee:'JAM',product:'WOLF+',ads:30000,commission:90,date:'2026-09-18',source:'sheet'},{employee:'BALL',product:'WOLF+',ads:40000,commission:130,date:'2026-09-18',source:'sheet'}]}}));
  const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:8014/index.html',{waitUntil:'domcontentloaded'});
  await p.locator('#rb-mobile-app-nav').waitFor();
  await p.locator('[data-mobile-nav="menu"]').click();
  const keys=await p.locator('#rb-mobile-menu [data-mobile-destination]').evaluateAll(es=>es.map(e=>e.dataset.mobileDestination));
  assert.equal(keys.includes('planner'),role==='sup');assert.equal(keys.includes('settings'),role==='sup');
  if(role==='ads'){assert.deepEqual(keys,['schedule','profile']);await p.locator('[aria-label="ปิดเมนู"]').click();assert.equal(await p.locator('[data-mobile-nav="order"]').isVisible(),false);await ctx.close();continue;}
  await p.locator('[data-mobile-destination="order"]').click();
  await p.locator('.ord-table tbody tr').first().waitFor().catch(async error=>{console.log('navigation diagnostic',role,await p.evaluate(()=>({user:window._rbUser?.role,orders:window.lpORD?.().map(o=>({id:o.id,assignee:o.assignee})),panel:document.querySelector('.tab-panel.active')?.id,sub:document.querySelector('.gsp-active')?.dataset.sub,text:document.querySelector('#ord-tw')?.innerText})));throw error;});
  assert.equal(await p.locator('#ord-add-btn').isVisible(),role==='sup');
  assert.equal(await p.locator('#rb-mobile-app-nav svg').count(),5,'all navigation icons render as vectors');
  assert.equal(await p.locator('#rb-personal-add').isVisible(),['sup','graphic','spec'].includes(role));
  if(['sup','graphic','spec'].includes(role)){await p.locator('#rb-personal-add').click();await p.locator('#rb-personal-work').waitFor();assert.equal(await p.locator('#rb-personal-work input:enabled').count(),6);await p.getByRole('button',{name:'ปิด',exact:true}).last().click();}
  assert.ok(await p.locator('#rb-mobile-app-nav').evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=10&&r.right<=innerWidth-10&&parseFloat(getComputedStyle(e).borderRadius)>=30;}),'floating capsule fits viewport');
  assert.ok(await p.locator('.ord-table tbody tr').first().evaluate(e=>e.getBoundingClientRect().height<330),'order card should be compact');
  assert.ok(await p.locator('.ord-table tbody tr').first().evaluate(row=>{const a=row.querySelector('[data-label="เลขงาน"]').getBoundingClientRect(),b=row.querySelector('[data-label="สถานะ"]').getBoundingClientRect(),name=row.querySelector('[data-label="ชื่องาน"]').getBoundingClientRect();return a.right<=b.left+1&&name.width>row.clientWidth*.8;}),'ID and status must not overlap; name spans the card');
  if(role==='sup'){
   await p.locator('#rb-mobile-order-actions #ord-planner-btn').waitFor();
   assert.equal(await p.locator('#ord-type-filter').isVisible(),false);await p.locator('.rb-mobile-filter-toggle').click();assert.equal(await p.locator('#ord-type-filter').isVisible(),true);await p.locator('.rb-mobile-filter-toggle').click();
   assert.ok(await p.locator('#rb-mobile-order-actions').evaluate(e=>e.getBoundingClientRect().bottom<document.getElementById('ord-stats').getBoundingClientRect().top+1),'primary actions above stats');
   await p.locator('#ord-add-btn').click();await p.locator('#rb-order-modal').waitFor();
   await p.getByRole('button',{name:'ปิด',exact:true}).last().click();
   await p.locator('#ord-planner-btn').click();
   await p.locator('#rb-order-planner.is-open').waitFor();
   assert.equal(await p.locator('#rb-order-planner').isVisible(),true,'planner opens');
   await p.evaluate(()=>window.rbOrderPlanner.close());
   await p.screenshot({path:path.resolve(root,'../mobile482-orders.png')});
   await p.locator('[data-mobile-nav="menu"]').click();await p.locator('[data-mobile-destination="commission"]').click();
   await p.locator('[data-cc-view]').selectOption('staff:team');
   await p.locator('[data-cc-period]').fill('2026-09');await p.locator('[data-cc-period]').dispatchEvent('change');
   await p.locator('.cc-ranking').waitFor();
   assert.ok(await p.locator('.cc-ranking>header').evaluate(e=>e.getBoundingClientRect().height<130),'ranking header is compact');
   await p.screenshot({path:path.resolve(root,'../mobile482-commission.png')});
   await p.locator('[data-mobile-nav="order"]').click();
   await p.setViewportSize({width:1280,height:900});await p.waitForTimeout(100);
   assert.equal(await p.locator('#rb-mobile-app-nav').isVisible(),false);assert.equal(await p.locator('.graphic-subnav').isVisible(),true);
   assert.equal(await p.locator('#ord-add-btn').evaluate(e=>e.parentElement.id==='rb-mobile-order-actions'),false,'desktop original controls restored');
   await p.setViewportSize({width:390,height:844});await p.locator('#rb-mobile-order-actions #ord-add-btn').waitFor();
  }
  await ctx.close();
 }
 assert.deepEqual(errors,[]);console.log('PASS mobile navigation and actions across five roles, compact cards, planner/new order, commission, desktop restoration');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
