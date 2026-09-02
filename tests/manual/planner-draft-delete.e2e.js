const {chromium}=require('playwright');
const assert=require('assert');

(async()=>{
  const target=process.argv[2]||'http://127.0.0.1:8014/tests/fixtures/order-planner-harness.html?role=sup&preserve=1&stale=1&delay=1500';
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  const context=await browser.newContext();
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(target,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{localStorage.removeItem('rb_order_planner_deleted_v1');localStorage.setItem('rb_order_planner_drafts_v1',JSON.stringify([{id:'stale_draft',name:'รายการที่ต้องการลบ',type:'กราฟิก',deadline:'2026-09-04',scheduledDate:'2026-09-01',updatedAt:Date.now()}]))});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#ord-planner-btn').click();
  assert.strictEqual(await page.locator('.rbp-draft-delete').count(),1,'tab 1 must show one delete button for the selected row');
  await page.evaluate(()=>{window.confirm=()=>true;document.querySelector('.rbp-draft-delete').click();});
  await page.waitForTimeout(1800);
  const afterDelete=await page.evaluate(()=>({items:[...document.querySelectorAll('[data-action="select-draft"]')].map(el=>el.textContent.trim()),drafts:JSON.parse(localStorage.getItem('rb_order_planner_drafts_v1')||'[]')}));
  assert.ok(!afterDelete.items.some(text=>text.includes('รายการที่ต้องการลบ')),'the selected draft must disappear immediately: '+JSON.stringify(afterDelete));
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#ord-planner-btn').click();
  await page.waitForTimeout(1800);
  assert.strictEqual(await page.getByText('รายการที่ต้องการลบ',{exact:true}).count(),0,'a deleted draft must not return after refresh');
  assert.deepStrictEqual(errors,[],'draft deletion must not cause browser errors');
  console.log('planner draft delete: button, confirmation, persistence and refresh passed');
  await browser.close();
})().catch(error=>{console.error(error);process.exit(1);});
