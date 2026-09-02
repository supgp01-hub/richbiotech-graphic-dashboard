const {chromium}=require('playwright');
const assert=require('assert');

(async()=>{
  const target=process.argv[2]||'http://127.0.0.1:8017/tests/fixtures/order-planner-harness.html?role=sup&preserve=1&cloud=1';
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  const context=await browser.newContext();
  const page=await context.newPage(),errors=[];
  page.setDefaultTimeout(12000);
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(target,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{
    const now=Date.now()-2000;
    localStorage.removeItem('rb_order_planner_deleted_v1');
    localStorage.removeItem('rb_order_planner_pending_v1');
    localStorage.removeItem('rb_order_planner_drafts_v1');
    localStorage.removeItem('rb_generic_write_queue_v3');
    localStorage.setItem('rb_fixture_planner_cloud',JSON.stringify({
      link_date_guard:{
        id:'link_date_guard',name:'งานเก็บลิงก์และวันที่',type:'กราฟิก',deadline:'2026-09-04',
        scheduledDate:'2026-09-03',dispatchTime:'08:30',status:'draft',orderId:'',
        createdAt:now,updatedAt:now,updatedBy:'ผู้ทดสอบ'
      }
    }));
  });
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#ord-planner-btn').click();
  await page.locator('[data-action="select-draft"]').filter({hasText:'งานเก็บลิงก์และวันที่'}).waitFor();
  const editor=page.locator('.rbp-detail-editor');
  const expectedLink='https://drive.google.com/drive/folders/link-date-regression';
  await page.evaluate(({expectedLink})=>{
    const link=document.querySelector('.rbp-detail-editor [data-field="sampleLink"]');
    const date=document.querySelector('.rbp-detail-editor [data-field="scheduledDate"]');
    link.value=expectedLink;
    link.dispatchEvent(new Event('input',{bubbles:true}));
    date.value='2026-09-05';
    date.dispatchEvent(new Event('input',{bubbles:true}));
  },{expectedLink});

  // Reproduce the former race: another refresh path remembers the latest local
  // snapshot before the debounced cloud write checks for changed fields.
  await page.evaluate(()=>{
    const local=JSON.parse(localStorage.getItem('rb_order_planner_drafts_v1')||'[]');
    window._rbOrderPlannerTest.rememberDrafts(local);
  });
  await page.waitForTimeout(900);
  await page.waitForFunction(()=>window.rbPersistence.pendingCount()===0);
  await page.evaluate(()=>window._rbOrderPlannerTest.refreshPlannerFromCloud());
  await page.locator('.rbp-close').click();
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#ord-planner-btn').click();
  await page.locator('[data-action="select-draft"]').filter({hasText:'งานเก็บลิงก์และวันที่'}).click();
  assert.strictEqual(await editor.locator('[data-field="sampleLink"]').inputValue(),expectedLink,'link must survive cloud confirmation, close and refresh');
  assert.strictEqual(await editor.locator('[data-field="scheduledDate"]').inputValue(),'2026-09-05','schedule date must survive cloud confirmation, close and refresh');
  const cloud=await page.evaluate(()=>JSON.parse(localStorage.getItem('rb_fixture_planner_cloud')||'{}').link_date_guard);
  assert.strictEqual(cloud.sampleLink,expectedLink,'the complete link must be stored online, not only in the local form');
  assert.strictEqual(cloud.scheduledDate,'2026-09-05','the selected date must be stored online, not only in the local form');
  assert.deepStrictEqual(errors,[],'link and date persistence must not produce browser errors');
  console.log('planner link/date persistence: baseline race, close and refresh passed');
  await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
