const {chromium}=require('playwright');
const assert=require('assert');
const target=process.argv[2]||'http://127.0.0.1:8014/index.html?v=fix243';
const seedOrder={id:'GR901',_fbKey:'qa_role_order',name:'Role action test',product:'Liv CARE',type:'กราฟิก',deadline:'2026-08-23',status:'pending',assignee:'DOM',note:'',createdAt:Date.now(),updatedAt:Date.now()};

async function waitRuntime(page){
  for(let i=0;i<180;i++){
    if(await page.evaluate(()=>typeof window.openOM==='function'&&typeof window._rbInitOP==='function'&&!!window.rbWorkflowOps))return;
    await page.waitForTimeout(500);
  }
  throw new Error('role runtime did not become ready');
}
async function setRole(page,role,name){
  await page.evaluate(({role,name,seedOrder})=>{
    window._rbUser={role,name};
    localStorage.setItem('rb_session',JSON.stringify({name,role,expiresAt:Date.now()+3600000}));
    localStorage.setItem('rb_orders_v1',JSON.stringify([seedOrder]));
    document.body.classList.toggle('rb-ads-only',role==='ads');
    document.body.classList.toggle('rb-not-sup',role!=='sup');
    if(window._OF){window._OF.status='';window._OF.dl='';window._OF.date='';window._OF.search='';window._OF.activeCard='all';}
    if(window._rbInitOP)window._rbInitOP();
  },{role,name,seedOrder});
}
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  const context=await browser.newContext();
  await context.addInitScript(({seedOrder})=>{
    localStorage.setItem('rb_session',JSON.stringify({name:'View',role:'sup',expiresAt:Date.now()+3600000}));
    localStorage.setItem('rb_orders_v1',JSON.stringify([seedOrder]));
    localStorage.setItem('rb_theme','dark');
  },{seedOrder});
  await context.route(/firebaseio\.com/,route=>route.abort('blockedbyclient'));
  await context.route(/docs\.google\.com\/spreadsheets/,route=>route.fulfill({status:200,contentType:'text/csv; charset=utf-8',body:'ชื่อเพจ,สินค้า,สถานะ,พนักงาน,Facebook ID\nเพจทดสอบ,Liv CARE,ใช้งาน,DOM,10001'}));
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(target,{waitUntil:'commit',timeout:60000});await page.waitForSelector('#sidebar',{timeout:90000});await waitRuntime(page);

  for(const [role,name] of [['sup','View'],['spec','Moss'],['graphic','Dom'],['audit','Nui'],['ads','Mind']]){
    console.log('checking role',role);
    await setRole(page,role,name);
    await page.evaluate(()=>window.rbWorkflowOps.open());await page.waitForSelector('.rb-ops-overlay.is-open');
    assert.strictEqual(await page.locator('.rb-ops-tab').count(),5,`${role} must open all workflow-center sections`);
    await page.locator('.rb-ops-close').click();
    if(role==='ads')continue;
    await page.evaluate(()=>{var b=Array.from(document.querySelectorAll('#sidebar button')).find(x=>(x.textContent||'').includes('Graphic'));if(b)b.click()});
    await page.locator('.gsnav-btn').filter({hasText:'สั่งงาน'}).click();await page.waitForSelector('[data-sub="order"].gsp-active');await page.evaluate(()=>window._rbInitOP());await page.waitForTimeout(120);
    assert.ok(await page.getByText('GR901',{exact:true}).count()>=1,`${role} must see the assigned order`);
    const editButtons=page.getByRole('button',{name:'แก้ไขงาน'}),rowActions=page.locator('.rb-order-edit-btn,.rb-order-view-btn,[data-order-action]');
    assert.ok(await rowActions.count()>=1,`${role} must have an order action button`);
    await rowActions.first().click();await page.waitForSelector('#om-primary-btn',{state:'attached'});
    if(role==='audit'){
      assert.strictEqual(await page.locator('#om-add-clip-btn').isDisabled(),true,'Audit must not edit employee delivery links');
      assert.strictEqual(await page.locator('#om-p1fix-btn').isDisabled(),true,'Audit must not upload employee revision images');
      await page.getByRole('tab',{name:'ตรวจออดิต'}).click();await page.getByRole('button',{name:'เสร็จสมบูรณ์'}).click();
      assert.strictEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('rb_orders_v1'))[0].status),'done','Audit must approve an order');
    }else{
      assert.strictEqual(await page.locator('#om-add-clip-btn').isDisabled(),false,`${role} must be able to add delivery/ad links`);
      assert.strictEqual(await page.locator('#om-p1fix-btn').isDisabled(),false,`${role} must be able to upload corrected work`);
      assert.strictEqual(await page.locator('#om-add-submitlink').isDisabled(),false,`${role} must be able to add a submission link`);
      await page.locator('#om-primary-btn').click();await page.waitForTimeout(180);
      assert.strictEqual(await page.locator('#om-primary-btn').isVisible(),false,`${role} action must close the modal`);
      if(role==='graphic')assert.strictEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('rb_orders_v1'))[0].status),'inprogress','Graphic must start assigned work');
    }
  }
  assert.deepStrictEqual(errors,[],`browser errors: ${errors.join(' | ')}`);
  await context.close();await browser.close();console.log('order role actions: all user roles passed');
})().catch(e=>{console.error(e);process.exit(1)});
