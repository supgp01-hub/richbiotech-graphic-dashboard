const {chromium}=require('playwright');
const assert=require('assert');

(async()=>{
  const target=process.argv[2]||'http://127.0.0.1:8014/index.html?v=local-hook';
  const order={
    id:'GR921',name:'Hook persistence test',product:'WOLF+',type:'ยิงแอด',
    deadline:'2026-08-25',status:'pending',assignee:'BALL',
    hook:'HOOK เดิมที่สั่งงาน',hook2:'HOOK เดิมลำดับ 2',
    brief:'ข้อมูลเดิมต้องอยู่ครบ',createdAt:Date.now(),updatedAt:Date.now()
  };
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  const context=await browser.newContext();
  await context.addInitScript(order=>{
    localStorage.setItem('rb_session',JSON.stringify({name:'View',role:'sup',expiresAt:Date.now()+3600000}));
    localStorage.setItem('rb_orders_v1',JSON.stringify([order]));
    localStorage.setItem('rb_theme','dark');
  },order);
  await context.route(/firebaseio\.com/,route=>route.abort('blockedbyclient'));
  await context.route('https://**',route=>route.abort('blockedbyclient'));
  const page=await context.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(target,{waitUntil:'commit',timeout:60000});
  await page.waitForFunction(()=>typeof window.openOM==='function'&&typeof window._rbInitOP==='function',null,{timeout:90000});
  await page.locator('#sidebar button').filter({hasText:'Graphic'}).click();
  await page.locator('.gsnav-btn').filter({hasText:'สั่งงาน'}).click();
  await page.getByRole('button',{name:'แก้ไขงาน'}).first().click();
  await page.waitForSelector('#rb-order-modal',{state:'visible'});
  assert.strictEqual(await page.locator('#om-hook').inputValue(),order.hook,'saved HOOK must be shown when the job opens');
  assert.strictEqual(await page.locator('#om-hook2').inputValue(),order.hook2,'saved HOOK 2 must be shown when the job opens');
  await page.locator('#om-hook').evaluate(el=>{el.value='';el.dispatchEvent(new Event('change',{bubbles:true}));});
  await page.locator('#om-hook2').evaluate(el=>{el.value='';el.dispatchEvent(new Event('change',{bubbles:true}));});
  await page.locator('#om-primary-btn').click();
  await page.waitForTimeout(300);
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('rb_orders_v1')||'[]')[0]);
  assert.strictEqual(saved.hook,order.hook,'an uninitialized/blank HOOK control must not erase the saved HOOK');
  assert.strictEqual(saved.hook2,order.hook2,'an uninitialized/blank HOOK 2 control must not erase the saved HOOK 2');
  assert.strictEqual(saved.brief,order.brief,'unrelated order data must remain unchanged');
  await page.evaluate(()=>{
    const orders=JSON.parse(localStorage.getItem('rb_orders_v1'));orders[0].hook='';orders[0].hook2='';localStorage.setItem('rb_orders_v1',JSON.stringify(orders));
    localStorage.setItem('rb_olympplus_v1',JSON.stringify([{id:'ct_hook_recovery',brand:'WOLF+',episode:'Hook persistence test',ready:'HOOK กู้คืนจากข้อมูลต้นทาง'}]));
    window._rbInitOP();
  });
  await page.getByRole('button',{name:'แก้ไขงาน'}).first().click();
  assert.strictEqual(await page.locator('#om-hook').inputValue(),'HOOK กู้คืนจากข้อมูลต้นทาง','one exact Content Tracker match must recover an older blank HOOK');
  assert.deepStrictEqual(errors,[],`browser errors: ${errors.join(' | ')}`);
  await browser.close();
  console.log('order hook persistence: all tests passed');
})().catch(error=>{console.error(error);process.exit(1);});
