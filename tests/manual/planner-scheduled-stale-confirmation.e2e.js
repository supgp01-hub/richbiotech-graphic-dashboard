const {chromium}=require('playwright');
const assert=require('assert');

(async()=>{
  const target=process.argv[2]||'http://127.0.0.1:8016/tests/fixtures/order-planner-harness.html?role=sup&preserve=1&cloud=1';
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  const context=await browser.newContext();
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(target,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{
    const now=Date.now()-2000;
    localStorage.removeItem('rb_order_planner_deleted_v1');
    localStorage.removeItem('rb_order_planner_pending_v1');
    localStorage.removeItem('rb_order_planner_drafts_v1');
    localStorage.removeItem('rb_generic_write_queue_v3');
    localStorage.setItem('rb_fixture_planner_cloud',JSON.stringify({
      schedule_guard:{
        id:'schedule_guard',name:'งานตั้งเวลาต้องไม่หาย',type:'กราฟิก',deadline:'2026-09-04',
        scheduledDate:'2026-09-03',dispatchTime:'23:59',status:'draft',orderId:'',
        createdAt:now,updatedAt:now,updatedBy:'ผู้ทดสอบ'
      }
    }));
  });
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#ord-planner-btn').click();
  await page.locator('[data-action="select-draft"]').filter({hasText:'งานตั้งเวลาต้องไม่หาย'}).waitFor();
  await page.locator('.rbp-draft-item').filter({hasText:'งานตั้งเวลาต้องไม่หาย'}).locator('[data-select="1"]').check();
  await page.getByRole('button',{name:'ตั้งเวลางานที่เลือก',exact:true}).click();
  await page.waitForFunction(()=>window.rbPersistence.pendingCount()===0);

  const scheduled=await page.evaluate(()=>JSON.parse(localStorage.getItem('rb_order_planner_drafts_v1')).find(row=>row.id==='schedule_guard'));
  assert.strictEqual(scheduled.status,'scheduled','selected work must enter the scheduled queue');
  assert.match(scheduled.orderId,/^GR\d+$/,'scheduled work must reserve one GR id');
  assert.ok(scheduled.updatedAt>scheduled.createdAt,'scheduling must create a newer record version');

  // Reproduce the former failure: an old draft payload arrives with the exact
  // same timestamp as the scheduled payload. It must not be accepted as saved.
  await page.evaluate(saved=>{
    const stale=Object.assign({},saved,{status:'draft',orderId:''});
    localStorage.setItem('rb_fixture_planner_cloud',JSON.stringify({schedule_guard:stale}));
  },scheduled);
  await page.evaluate(()=>window._rbOrderPlannerTest.refreshPlannerFromCloud());
  assert.strictEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('rb_order_planner_drafts_v1')).find(row=>row.id==='schedule_guard').status),'scheduled','a stale equal-version draft must not reverse scheduled status');
  assert.strictEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('rb_fixture_planner_cloud')).schedule_guard.status),'scheduled','the protected scheduled payload must repair stale online data');

  await page.evaluate(()=>window._rbOrderPlannerTest.refreshPlannerFromCloud());
  assert.strictEqual(await page.evaluate(()=>!!window._rbOrderPlannerTest.pendingDraftMarks().schedule_guard),false,'guard must clear only after the scheduled payload is confirmed online');
  await page.locator('.rbp-close').click();
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#ord-planner-btn').click();
  assert.strictEqual(await page.locator('#rbp-stat-scheduled').innerText(),'1','scheduled count must survive close and refresh');
  await page.locator('[data-status-filter="scheduled"]').click();
  assert.strictEqual(await page.locator('[data-action="select-draft"]').filter({hasText:'งานตั้งเวลาต้องไม่หาย'}).count(),1,'the scheduled job must remain visible after reopening');
  assert.deepStrictEqual(errors,[],'schedule persistence workflow must not produce browser errors');
  console.log('planner scheduled guard: schedule, stale refresh, close and reopen passed');
  await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
