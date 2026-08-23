const {chromium}=require('playwright');
const assert=require('assert');
const target=process.argv[2]||'http://127.0.0.1:8011/index.html?v=fix241-ops';
const screenshotPath=process.argv[3]||'';
const seed=[
  {id:'GR981',_fbKey:'ops_a',name:'งานใหม่ทดสอบ',product:'Liv CARE',type:'ยิงแอด',deadline:'2026-08-30',status:'pending',assignee:'DOM',createdAt:Date.now(),updatedAt:Date.now()},
  {id:'GR982',_fbKey:'ops_b',name:'งานรอตรวจทดสอบ',product:'WOLF+',type:'กราฟิก',deadline:'2026-08-24',status:'review',assignee:'TER',createdAt:Date.now(),updatedAt:Date.now()},
  {id:'GR983',_fbKey:'ops_c',name:'งานต้องแก้ทดสอบ',product:'JUDO',type:'รูปภาพ',deadline:'2026-08-20',status:'revision',assignee:'NUNE',createdAt:Date.now(),updatedAt:Date.now()}
];
async function prepare(context,role='sup',name='View'){
  await context.addInitScript(({role,name,seed})=>{
    localStorage.setItem('rb_session',JSON.stringify({name,role,expiresAt:Date.now()+3600000}));
    localStorage.setItem('rb_orders_v1',JSON.stringify(seed));
    localStorage.setItem('rb_theme','dark');
    localStorage.removeItem('rb_ops_locks_v1');
  },{role,name,seed});
  await context.route(/firebaseio\.com/,route=>route.abort('blockedbyclient'));
  await context.route(/docs\.google\.com\/spreadsheets/,route=>route.fulfill({status:200,contentType:'text/csv; charset=utf-8',body:'ชื่อเพจ,สินค้า,สถานะ,พนักงาน,Facebook ID\nเพจทดสอบ,Liv CARE,ใช้งาน,DOM,10001'}));
}
async function ready(page){
  await page.goto(target,{waitUntil:'commit',timeout:60000});
  await page.waitForSelector('#sidebar',{timeout:90000});
  for(let i=0;i<180;i++){
    if(await page.evaluate(()=>!!window.rbWorkflowOps&&typeof window.openOM==='function'))return;
    await page.waitForTimeout(500);
  }
  throw new Error('workflow runtime did not become ready: '+JSON.stringify(await page.evaluate(()=>({ready:document.readyState,ops:typeof window.rbWorkflowOps,openOM:typeof window.openOM,scripts:document.scripts.length}))));
}
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  const context=await browser.newContext();await prepare(context);
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await ready(page);
  await page.waitForSelector('#rb-ops-global-open',{state:'visible'});
  await page.locator('#rb-ops-global-open').click();
  await page.waitForSelector('.rb-ops-overlay.is-open');
  if(screenshotPath)await page.screenshot({path:screenshotPath,fullPage:false});
  assert.strictEqual(await page.locator('.rb-ops-card').count(),5,'inbox summary must show five clear cards');
  assert.strictEqual(await page.locator('.rb-ops-check').count(),3,'Supervisor must be able to select multiple jobs');
  await page.locator('.rb-ops-check[data-key="ops_a"]').check();await page.locator('.rb-ops-check[data-key="ops_b"]').check();
  assert.strictEqual(await page.locator('#rb-ops-bulk').getAttribute('class'),'rb-ops-bulk is-visible');
  await page.locator('#rb-ops-bulk-status').selectOption('inprogress');
  page.once('dialog',d=>d.accept());await page.locator('#rb-ops-apply').click();
  const changed=await page.evaluate(()=>JSON.parse(localStorage.getItem('rb_orders_v1')).filter(x=>['ops_a','ops_b'].includes(x._fbKey)).every(x=>x.status==='inprogress'));
  assert.strictEqual(changed,true,'confirmed bulk status change must save both selected jobs');
  await page.locator('.rb-ops-tab[data-view="timeline"]').click();
  assert.ok(await page.locator('.rb-ops-event').count()>=2,'timeline must record bulk changes');
  await page.locator('.rb-ops-tab[data-view="notice"]').click();assert.ok(await page.locator('.rb-ops-notice').count()>=1,'notification center must list actionable jobs');
  await page.locator('.rb-ops-tab[data-view="health"]').click();assert.strictEqual(await page.locator('.rb-ops-health').count(),6,'health page must expose all six diagnostics');
  await page.locator('.rb-ops-tab[data-view="snapshot"]').click();await page.locator('#rb-ops-snapshot-now').click();assert.ok(await page.locator('.rb-ops-snapshot').count()>=1,'Supervisor must be able to create a snapshot');
  await page.locator('.rb-ops-close').click();
  await page.locator('#sidebar button').filter({hasText:'Graphic'}).click();await page.locator('.gsnav-btn').filter({hasText:'สั่งงาน'}).click();await page.waitForSelector('#rb-ops-open',{state:'visible'});
  const second=await context.newPage();await ready(second);await second.locator('#sidebar button').filter({hasText:'Graphic'}).click();await second.locator('.gsnav-btn').filter({hasText:'สั่งงาน'}).click();
  await page.evaluate(()=>window.openOM('GR981'));await page.waitForSelector('#rb-order-modal',{state:'visible'});await page.waitForTimeout(250);
  await second.evaluate(()=>window.openOM('GR981'));await second.waitForSelector('#rb-order-modal',{state:'visible'});await second.waitForTimeout(350);
  assert.strictEqual(await second.locator('#rb-order-modal').getAttribute('data-rb-locked'),'1','second tab must open the same job in protected read-only mode');
  assert.ok(await second.locator('.rb-ops-lock-banner').count()===1,'locked job must clearly identify the active editor');
  assert.deepStrictEqual(errors,[],`browser errors: ${errors.join(' | ')}`);
  await context.close();await browser.close();console.log('workflow operations: inbox, bulk, timeline, notifications, health, snapshot and multitab lock passed');
})().catch(e=>{console.error(e);process.exit(1)});
