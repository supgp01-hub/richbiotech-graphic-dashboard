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
    const base={type:'กราฟิก',deadline:'2026-09-04',scheduledDate:'2026-09-03',dispatchTime:'08:30',status:'dispatched',workStatus:'pending',dispatchedAt:Date.now()-5000,updatedAt:Date.now()-5000};
    localStorage.setItem('rb_fixture_planner_cloud',JSON.stringify({
      missing:Object.assign({},base,{id:'missing',orderId:'GR500',name:'งานปลายทางหาย',finalAssignee:'MOS'}),
      existing:Object.assign({},base,{id:'existing',orderId:'GR501',name:'งานที่ครบอยู่แล้ว',finalAssignee:'DOM'})
    }));
    localStorage.setItem('rb_fixture_planner_orders',JSON.stringify({planner_existing:{id:'GR501',sourceDraftId:'existing',name:'งานที่ครบอยู่แล้ว'}}));
  });
  await page.reload({waitUntil:'domcontentloaded'});
  await page.evaluate(()=>window.rbOrderPlanner.run());
  await page.waitForFunction(()=>Object.values(JSON.parse(localStorage.getItem('rb_fixture_planner_orders')||'{}')).some(order=>order.sourceDraftId==='missing'));
  const first=await page.evaluate(()=>JSON.parse(localStorage.getItem('rb_fixture_planner_orders')||'{}'));
  assert.strictEqual(Object.values(first).filter(order=>order.sourceDraftId==='missing').length,1,'one missing downstream order must be reconstructed');
  assert.strictEqual(first.planner_missing.id,'GR500','the repaired order must keep the reserved GR number');
  assert.strictEqual(first.planner_missing.assignee,'MOS','the repaired order must keep the final assignee');
  assert.strictEqual(first.planner_missing.integrityRecoveredBy,'ระบบตรวจสอบแพลน');
  await page.evaluate(()=>window.rbOrderPlanner.run());
  const second=await page.evaluate(()=>JSON.parse(localStorage.getItem('rb_fixture_planner_orders')||'{}'));
  assert.strictEqual(Object.keys(second).length,Object.keys(first).length,'a second integrity pass must not duplicate any order');
  assert.deepStrictEqual(errors,[],'integrity repair must not produce browser errors');
  console.log('planner integrity repair: missing order rebuilt once without duplication');
  await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
