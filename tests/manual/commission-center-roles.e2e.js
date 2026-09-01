const {chromium}=require('playwright');
const assert=require('assert');

const url=process.argv[2]||'http://127.0.0.1:8014/tests/manual/commission-center-harness.html?v=fix312';
const csv='Employee,Product,Ads,Commission,Date\nBALL,JUDO,10000,500,2026-08-28\nDOM,WOLF+,20000,800,2026-08-29\nJAM,JUDO,15000,750,2026-08-30\n';

async function openRole(browser,role,name){
  const context=await browser.newContext();
  await context.addInitScript(({role,name})=>{
    localStorage.setItem('cc_test_user',JSON.stringify({name,role}));
  },{role,name});
  await context.route(/^https:/,route=>{
    const requestUrl=route.request().url();
    if(/docs\.google\.com\/spreadsheets/.test(requestUrl))return route.fulfill({status:200,contentType:'text/csv; charset=utf-8',body:csv});
    if(/fonts\.googleapis\.com/.test(requestUrl))return route.fulfill({status:200,contentType:'text/css',body:''});
    if(/firebaseio\.com/.test(requestUrl)&&/text%2Fevent-stream/.test(requestUrl))return route.fulfill({status:200,contentType:'text/event-stream',body:'event: put\ndata: {"path":"/","data":null}\n\n'});
    if(/firebaseio\.com/.test(requestUrl))return route.fulfill({status:200,contentType:'application/json',body:'null'});
    return route.abort('blockedbyclient');
  });
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>window._rbCommissionTest,null,{timeout:10000});
  await page.waitForSelector('.rb-commission-app .cc-shell',{timeout:30000});
  return{context,page,errors};
}

(async()=>{
  const browser=await chromium.launch({headless:true,channel:'chrome'});

  const sup=await openRole(browser,'sup','View');
  assert.match(await sup.page.locator('.cc-role-chip').textContent(),/Supervisor/);
  assert.strictEqual(await sup.page.locator('[data-cc-view]').count(),1);
  assert.strictEqual(await sup.page.locator('[data-cc-action="toggle-lock"]').count(),1);
  await sup.page.locator('[data-cc-view]').selectOption('audit');
  await sup.page.waitForSelector('.cc-preview-note');
  assert.match(await sup.page.locator('.cc-role-chip').textContent(),/Audit/);
  assert.ok(await sup.page.locator('[data-cc-audit-row]').count()>0);
  assert.strictEqual(await sup.page.locator('[data-cc-ads]:not([disabled])').count(),0,'Supervisor preview must not edit Audit data');
  assert.ok(await sup.page.locator('[data-cc-action="save-audit"]').isDisabled(),'Supervisor preview must not save Audit data');
  assert.strictEqual(await sup.page.evaluate(()=>window._rbCommissionTest.actualRoleView()),'supervisor');
  await sup.page.locator('[data-cc-view]').selectOption('staff:BALL');
  assert.match(await sup.page.locator('.cc-role-chip').textContent(),/BALL/);
  assert.match(await sup.page.locator('.rb-commission-app').textContent(),/มุมมองข้อมูลส่วนตัวของ BALL/);
  await sup.page.locator('[data-cc-view]').selectOption('supervisor');
  assert.strictEqual(await sup.page.locator('[data-cc-action="toggle-lock"]').count(),1);
  assert.deepStrictEqual(sup.errors,[]);
  await sup.context.close();

  const audit=await openRole(browser,'audit','Audit');
  assert.match(await audit.page.locator('.cc-role-chip').textContent(),/Audit/);
  assert.strictEqual(await audit.page.locator('[data-cc-view]').count(),0);
  assert.ok(await audit.page.locator('[data-cc-audit-row]').count()>0);
  assert.deepStrictEqual(await audit.page.evaluate(()=>[19999,20000,25000,60000,80000].map(window._rbCommissionTest.commissionForAds)),[0,70,80,240,400]);
  const firstInput=audit.page.locator('[data-cc-ads]').first();
  await firstInput.fill('2500');
  await audit.page.locator('[data-cc-action="save-audit"]').click();
  await audit.page.waitForTimeout(250);
  const saved=await audit.page.evaluate(()=>JSON.parse(localStorage.getItem('rb_commission_center_v1')||'{}'));
  assert.ok(Array.isArray(saved.records)&&saved.records.some(r=>r.ads===2500),'Audit save must persist after click');
  assert.deepStrictEqual(audit.errors,[]);
  await audit.context.close();

  const staff=await openRole(browser,'graphic','บอล');
  assert.match(await staff.page.locator('.cc-role-chip').textContent(),/Graphic & Ads/);
  assert.strictEqual(await staff.page.locator('[data-cc-view]').count(),0);
  assert.strictEqual(await staff.page.locator('[data-cc-action="save-audit"]').count(),0);
  assert.strictEqual(await staff.page.locator('[data-cc-action="toggle-lock"]').count(),0);
  assert.match(await staff.page.locator('.rb-commission-app').textContent(),/เฉพาะข้อมูลของตัวเอง/);
  assert.deepStrictEqual(staff.errors,[]);
  await staff.context.close();

  await browser.close();
  console.log('commission center role and save flow: passed');
})().catch(err=>{console.error(err);process.exit(1)});
