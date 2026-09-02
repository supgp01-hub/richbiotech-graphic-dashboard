const {chromium}=require('playwright');
const assert=require('assert');

(async()=>{
  const target=process.argv[2]||'http://127.0.0.1:8014/tests/fixtures/order-planner-harness.html?role=sup&preserve=1&cloud=1';
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  const context=await browser.newContext();
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(target,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{
    localStorage.removeItem('rb_order_planner_deleted_v1');
    localStorage.removeItem('rb_order_planner_pending_v1');
    localStorage.removeItem('rb_order_planner_drafts_v1');
    localStorage.removeItem('rb_generic_write_queue_v3');
    localStorage.setItem('rb_fixture_planner_cloud',JSON.stringify({existing:{id:'existing',name:'งานเดิม',type:'กราฟิก',deadline:'2026-09-04',scheduledDate:'2026-09-02',status:'draft',updatedAt:Date.now()-1000}}));
  });
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#ord-planner-btn').click();
  await page.getByRole('button',{name:'+ เพิ่มงาน',exact:true}).click();
  await page.locator('.rbp-detail-editor [data-field="name"]').fill('งานใหม่ต้องอยู่ต่อ');
  await page.getByRole('button',{name:'บันทึกฉบับร่างทั้งหมด',exact:true}).click();
  await page.waitForFunction(()=>window.rbPersistence.pendingCount()===0);
  const newId=await page.evaluate(()=>JSON.parse(localStorage.getItem('rb_order_planner_drafts_v1')).find(row=>row.name==='งานใหม่ต้องอยู่ต่อ').id);
  assert.ok(await page.evaluate(id=>window._rbOrderPlannerTest.pendingDraftMarks()[id]>0,newId),'new row must remain guarded after the write response');

  await page.evaluate(id=>{const cloud=JSON.parse(localStorage.getItem('rb_fixture_planner_cloud')||'{}');delete cloud[id.replace(/[^a-zA-Z0-9_-]/g,'_')];localStorage.setItem('rb_fixture_planner_cloud',JSON.stringify(cloud));},newId);
  await page.evaluate(()=>window._rbOrderPlannerTest.refreshPlannerFromCloud());
  assert.strictEqual(await page.locator('[data-action="select-draft"]').filter({hasText:'งานใหม่ต้องอยู่ต่อ'}).count(),1,'a stale online snapshot must not remove the newly added row');
  assert.ok(await page.evaluate(id=>Object.values(JSON.parse(localStorage.getItem('rb_fixture_planner_cloud')||'{}')).some(row=>row.id===id),newId),'the protected row must be written back when a stale snapshot omits it');

  await page.evaluate(()=>window._rbOrderPlannerTest.refreshPlannerFromCloud());
  assert.strictEqual(await page.evaluate(id=>!!window._rbOrderPlannerTest.pendingDraftMarks()[id],newId),false,'guard may clear only after the server returns the same saved row');
  assert.deepStrictEqual(errors,[],'stale confirmation guard must not produce browser errors');
  console.log('planner add guard: new work survives stale refresh until server confirmation');
  await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
