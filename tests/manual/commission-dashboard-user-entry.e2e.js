const {chromium}=require('playwright');
const assert=require('assert');

const url=process.argv[2]||'http://127.0.0.1:8014/index.html?v=fix316';
const csv='Employee,Product,Ads,Commission,Date\nBALL,JUDO,10000,500,2026-08-28\nDOM,WOLF+,20000,800,2026-08-29\nJAM,JUDO,15000,750,2026-08-30\nLINK,JUDO,17000,760,2026-08-30\nMOS,WOLF+,18000,780,2026-08-30\nNUNE,JUDO,19000,790,2026-08-30\nTER,WOLF+,21000,810,2026-08-30\n';

async function openDashboard(browser,role,name){
  const context=await browser.newContext();
  await context.addInitScript(({role,name})=>{
    localStorage.setItem('rb_session',JSON.stringify({name,role,expiresAt:Date.now()+3600000}));
    localStorage.setItem('rb_theme','dark');
  },{role,name});
  await context.route(/firebaseio\.com/,route=>route.abort('blockedbyclient'));
  await context.route(/docs\.google\.com\/spreadsheets/,route=>route.fulfill({status:200,contentType:'text/csv; charset=utf-8',body:csv}));
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(url,{waitUntil:'commit',timeout:60000});
  await page.waitForSelector('#sidebar',{timeout:90000});
  const graphic=page.locator('#sidebar button').filter({hasText:'Graphic'}).first();
  await graphic.click();
  await page.waitForSelector('#tab-team.active',{timeout:10000});
  const commission=page.locator('.gsnav-btn').filter({hasText:'ค่าคอมมิชชั่น'}).first();
  await commission.waitFor({state:'visible',timeout:10000});
  await commission.click();
  await page.waitForSelector('.gsp[data-sub="commission"].gsp-active .rb-commission-app .cc-shell',{timeout:15000});
  return{context,page,errors};
}

(async()=>{
  const browser=await chromium.launch({headless:true,channel:'chrome'});

  const graphic=await openDashboard(browser,'graphic','บอล');
  assert.strictEqual(await graphic.page.evaluate(()=>window._rbCommissionTest.actualRoleView()),'staff');
  assert.strictEqual(await graphic.page.locator('[data-cc-team-card="BALL"].is-own').count(),1);
  assert.ok(await graphic.page.locator('[data-cc-team-card]').count()>=7);
  assert.deepStrictEqual(graphic.errors,[]);
  await graphic.context.close();

  const specialist=await openDashboard(browser,'spec','มอส');
  assert.strictEqual(await specialist.page.evaluate(()=>window._rbCommissionTest.actualRoleView()),'staff');
  assert.strictEqual(await specialist.page.locator('[data-cc-team-card="MOS"].is-own').count(),1);
  assert.ok(await specialist.page.locator('[data-cc-team-card]').count()>=7);
  assert.deepStrictEqual(specialist.errors,[]);
  await specialist.context.close();

  const ads=await openDashboard(browser,'ads','นุ้ย');
  assert.strictEqual(await ads.page.evaluate(()=>window._rbCommissionTest.actualRoleView()),'staff');
  assert.ok(await ads.page.locator('[data-cc-team-card]').count()>=7);
  assert.strictEqual(await ads.page.locator('[data-cc-team-card].is-own').count(),0);
  assert.match(await ads.page.locator('.cc-team-section-head').textContent(),/เลือกการ์ดเพื่อดูรายละเอียด/);
  assert.deepStrictEqual(ads.errors,[]);
  await ads.context.close();

  await browser.close();
  console.log('commission dashboard real user entry: passed');
})().catch(error=>{console.error(error);process.exit(1)});
