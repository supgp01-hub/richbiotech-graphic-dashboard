const {chromium}=require('playwright');
const assert=require('assert');

(async()=>{
  const target=process.argv[2]||'http://127.0.0.1:8014/index.html?v=local240';
  const order={
    id:'GR902',name:'Revision link test',product:'WOLF+',type:'กราฟิก',
    deadline:'2026-08-25',status:'revision',assignee:'DOM',
    rawLink:'https://drive.google.com/creative',sheetLink:'https://docs.google.com/script',
    footageLink:'https://drive.google.com/footage',reviewLink:'https://drive.google.com/review',
    submitLinks:[],createdAt:Date.now(),updatedAt:Date.now()
  };
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  const context=await browser.newContext();
  await context.addInitScript(order=>{
    localStorage.setItem('rb_session',JSON.stringify({name:'Dom',role:'graphic',expiresAt:Date.now()+3600000}));
    localStorage.setItem('rb_orders_v1',JSON.stringify([order]));
    localStorage.setItem('rb_theme','dark');
  },order);
  await context.route(/firebaseio\.com/,route=>route.abort('blockedbyclient'));
  await context.route('https://**',route=>route.abort('blockedbyclient'));
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(target,{waitUntil:'commit',timeout:60000});
  await page.waitForSelector('#sidebar',{timeout:90000});
  await page.waitForFunction(()=>typeof window.openOM==='function'&&typeof window._rbInitOP==='function',null,{timeout:90000});
  await page.locator('#sidebar button').filter({hasText:'Graphic'}).click();
  await page.locator('.gsnav-btn').filter({hasText:'สั่งงาน'}).click();
  await page.waitForSelector('[data-sub="order"].gsp-active');
  await page.getByRole('button',{name:'แก้ไขงาน'}).first().click();
  await page.waitForSelector('#rb-order-modal',{state:'visible'});

  const submitInput=page.locator('#om-submitlink');
  assert.strictEqual(await submitInput.isDisabled(),false,'revision submit-link input must be editable for Graphic users');
  assert.strictEqual(await page.locator('#om-add-submitlink').isDisabled(),false,'add-link control must stay enabled during revision');

  const openButtons=page.locator('[data-link-btn="1"]');
  assert.ok(await openButtons.count()>=5,'reference links must expose open/copy actions');
  for(let i=0;i<await openButtons.count();i++)assert.strictEqual(await openButtons.nth(i).isDisabled(),false,'reference link actions must remain enabled in view mode');

  const primary=page.locator('#om-primary-btn');
  assert.match(await primary.innerText(),/ส่งตรวจอีกครั้ง/,'revision uses the resubmit action');
  const layout=await primary.evaluate(el=>{const s=getComputedStyle(el);return{display:s.display,align:s.alignItems,justify:s.justifyContent};});
  assert.ok(layout.display==='flex'||layout.display==='inline-flex');
  assert.strictEqual(layout.align,'center');
  assert.strictEqual(layout.justify,'center');

  await submitInput.fill('https://drive.google.com/new-revision');
  await primary.click();
  await page.waitForTimeout(300);
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('rb_orders_v1'))[0]);
  assert.strictEqual(saved.status,'review','resubmission must return the job to review');
  assert.deepStrictEqual(saved.submitLinks,['https://drive.google.com/new-revision']);
  assert.deepStrictEqual(errors,[],'no JavaScript errors are allowed');
  await browser.close();
  console.log('order revision resubmit: all tests passed');
})().catch(error=>{console.error(error);process.exit(1);});
