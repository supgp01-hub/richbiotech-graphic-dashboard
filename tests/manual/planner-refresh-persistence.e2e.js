const {chromium}=require('playwright');
const assert=require('assert');

(async()=>{
  const target=process.argv[2]||'http://127.0.0.1:8014/tests/fixtures/order-planner-harness.html?role=sup&offline=1&stale=1&preserve=1';
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  const context=await browser.newContext();
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(target,{waitUntil:'domcontentloaded'});
  await page.locator('#ord-planner-btn').click();
  await page.locator('.rbp-detail-editor [data-field="name"]').fill('งานใหม่ต้องไม่เด้งกลับ');
  await page.waitForTimeout(900);
  assert.strictEqual(await page.evaluate(()=>window.rbPersistence.pendingCount()),1,'failed cloud autosave must remain queued');
  assert.match(await page.locator('#rbp-save-state').innerText(),/รอซิงก์/,'offline autosave must not claim server success');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#ord-planner-btn').click();
  await page.waitForFunction(()=>document.querySelectorAll('[data-action="select-draft"]').length>=2);
  const savedItem=page.locator('[data-action="select-draft"]',{hasText:'งานใหม่ต้องไม่เด้งกลับ'});
  assert.strictEqual(await savedItem.count(),1,'the queued local edit must remain available after refresh');
  assert.strictEqual(await page.locator('[data-action="select-draft"]',{hasText:'ข้อมูลเก่าจากออนไลน์'}).count(),1,'a queued child save must not hide other jobs loaded from the online collection');
  await savedItem.click();
  assert.strictEqual(await page.locator('.rbp-detail-editor [data-field="name"]').inputValue(),'งานใหม่ต้องไม่เด้งกลับ','stale cloud data must not replace the queued local edit after refresh');

  await page.evaluate(()=>{window.__fixtureOnline=true;window.rbPersistence.flush();});
  await page.waitForFunction(()=>window.rbPersistence.pendingCount()===0);
  assert.deepStrictEqual(errors,[],'refresh persistence workflow must not produce browser errors');
  console.log('planner refresh persistence: local queue, stale-refresh protection and retry passed');
  await browser.close();
})().catch(error=>{console.error(error);process.exit(1);});
