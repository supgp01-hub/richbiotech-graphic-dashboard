const { chromium }=require('playwright');
const assert=require('assert');
(async()=>{
  const targetUrl=process.argv[2]||'http://127.0.0.1:8011/index.html?v=fix241';
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  const page=await browser.newPage();
  const browserErrors=[];
  page.on('pageerror',error=>browserErrors.push('pageerror: '+error.message));
  page.on('console',message=>{if(message.type()==='error'&&!/Failed to load resource/.test(message.text()))browserErrors.push('console: '+message.text());});
  await page.route('https://richbiotech-graphic-ads-default-rtdb.firebaseio.com/**',route=>route.abort());
  await page.route('https://**',route=>route.abort('blockedbyclient'));
  await page.addInitScript(()=>{
    const session={name:'วิว',role:'sup',expiresAt:Date.now()+3600000};
    localStorage.setItem('rb_session',JSON.stringify(session));
    localStorage.setItem('rb_users',JSON.stringify([{name:'วิว',role:'sup',pin:'1111',pinChanged:true}]));
    localStorage.setItem('lv_dash_v5',JSON.stringify({d:{'2026-8-22':[{empId:'ter',type:'hol'}]}}));
    localStorage.setItem('rb_theme','dark');
  });
  await page.goto(targetUrl,{waitUntil:'commit',timeout:60000});
  await page.waitForFunction(()=>typeof window.showTab==='function'&&typeof window.openOM==='function'&&typeof window.rbRefreshOrderLeaveGuard==='function',null,{timeout:90000});
  await page.evaluate(()=>{
    const team=[...document.querySelectorAll('nav button')].find(b=>(b.getAttribute('onclick')||'').includes("'team'"));
    window.showTab('team',team);
  });
  await page.locator('.gsnav-btn').filter({hasText:'สั่งงาน'}).click();
  await page.waitForSelector('#ord-add-btn');
  await page.locator('.ord-tab-btn').filter({hasText:'ทีมงาน'}).click();
  await page.locator('#ord-add-btn').click();
  await page.waitForSelector('#om-primary-btn');
  assert.strictEqual(await page.locator('#om-name').isDisabled(),false,'new order name must be editable');
  assert.match(await page.locator('#om-primary-btn').innerText(),/สั่งงาน/,'new order must show order action');
  await page.locator('#om-name').fill('Supervisor E2E test');
  await page.locator('#om-type').selectOption({index:1});
  await page.locator('#om-dl').fill('2026-08-23');
  assert.strictEqual(await page.locator('#om-st').inputValue(),'pending','new order must default to assigned status');
  await page.locator('#om-mb').selectOption('TER');
  const guard=await page.locator('#om-leave-guard').innerText();
  assert.match(guard,/ใช้งานได้/,'August 23 must be allowed when Ter is off on August 22');
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('rb_orders_v1')||'[]').length);
  await page.locator('#om-primary-btn').click();
  await page.getByRole('button',{name:'ยืนยันสั่งงาน'}).waitFor({state:'visible'});
  await page.getByRole('button',{name:'ยืนยันสั่งงาน'}).click();
  await page.waitForTimeout(500);
  const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('rb_orders_v1')||'[]').length);
  if(after!==before+1){
    console.error('browser errors:',browserErrors);
    console.error('validation:',await page.locator('#om-validation-msg').allTextContents());
    console.error('button:',await page.locator('#om-primary-btn').innerText());
  }
  assert.strictEqual(after,before+1,'new order must be persisted locally');
  assert.strictEqual(await page.locator('#om-primary-btn').isVisible(),false,'successful order must close the modal');
  console.log('order-supervisor e2e: all tests passed');
  await browser.close();
})().catch(error=>{console.error(error);process.exit(1);});
