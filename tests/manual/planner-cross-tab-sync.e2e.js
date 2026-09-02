const {chromium}=require('playwright');
const assert=require('assert');

(async()=>{
  const target=process.argv[2]||'http://127.0.0.1:8014/tests/fixtures/order-planner-harness.html?role=sup&preserve=1&cloud=1';
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  const context=await browser.newContext();
  const first=await context.newPage(),errors=[];
  first.on('pageerror',error=>errors.push('first: '+error.message));
  await first.goto(target,{waitUntil:'domcontentloaded'});
  await first.evaluate(()=>{
    localStorage.removeItem('rb_order_planner_deleted_v1');
    localStorage.removeItem('rb_order_planner_drafts_v1');
    localStorage.removeItem('rb_generic_write_queue_v3');
    localStorage.setItem('rb_fixture_planner_cloud',JSON.stringify({shared_existing:{id:'shared_existing',name:'งานเดิมร่วมกัน',type:'กราฟิก',deadline:'2026-09-04',scheduledDate:'2026-09-02',status:'draft',updatedAt:Date.now()-1000}}));
  });
  await first.reload({waitUntil:'domcontentloaded'});
  const second=await context.newPage();
  second.on('pageerror',error=>errors.push('second: '+error.message));
  await second.goto(target,{waitUntil:'domcontentloaded'});
  await first.locator('#ord-planner-btn').click();
  await second.locator('#ord-planner-btn').click();
  await first.waitForTimeout(700);
  await second.waitForTimeout(700);
  assert.strictEqual(await first.locator('[data-action="select-draft"]').count(),1,'first tab must start with the cloud row');
  assert.strictEqual(await second.locator('[data-action="select-draft"]').count(),1,'second tab must start with the same cloud row');

  await first.getByRole('button',{name:'+ เพิ่มงาน',exact:true}).click();
  await first.locator('.rbp-detail-editor [data-field="name"]').fill('งานซิงก์สองแท็บ');
  await first.getByRole('button',{name:'บันทึกฉบับร่างทั้งหมด',exact:true}).click();
  await second.waitForFunction(()=>Array.from(document.querySelectorAll('[data-action="select-draft"]')).some(el=>el.textContent.includes('งานซิงก์สองแท็บ')));
  assert.strictEqual(await second.locator('[data-action="select-draft"]').filter({hasText:'งานซิงก์สองแท็บ'}).count(),1,'saved work must appear in the other tab without refresh');

  await first.locator('[data-action="select-draft"]').filter({hasText:'งานซิงก์สองแท็บ'}).click();
  await first.evaluate(()=>{window.confirm=()=>true;document.querySelector('.rbp-draft-delete').click()});
  await second.waitForFunction(()=>!Array.from(document.querySelectorAll('[data-action="select-draft"]')).some(el=>el.textContent.includes('งานซิงก์สองแท็บ')));
  assert.strictEqual(await second.locator('[data-action="select-draft"]').filter({hasText:'งานซิงก์สองแท็บ'}).count(),0,'deleted work must disappear from the other tab without refresh');
  assert.strictEqual(await second.locator('[data-action="select-draft"]').filter({hasText:'งานเดิมร่วมกัน'}).count(),1,'syncing one work item must not remove another');
  assert.deepStrictEqual(errors,[],'cross-tab sync must not produce browser errors');
  console.log('planner cross-tab sync: add, save and delete stay identical without refresh');
  await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
