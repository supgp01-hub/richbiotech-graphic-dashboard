const {chromium}=require('playwright');
const assert=require('assert');

(async()=>{
  const targetUrl=process.argv[2]||'http://127.0.0.1:8025/index.html?v=fix265';
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  const context=await browser.newContext({viewport:{width:1280,height:900}});
  await context.addInitScript(()=>{
    localStorage.setItem('rb_session',JSON.stringify({name:'View',role:'sup',expiresAt:Date.now()+3600000}));
    localStorage.setItem('rb_theme','light');
    localStorage.removeItem('lv_dash_v5');
  });
  await context.route(/^https?:\/\/(?!127\.0\.0\.1:8025)/,route=>route.abort('blockedbyclient'));
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(targetUrl,{waitUntil:'commit',timeout:60000});
  await page.waitForSelector('#sidebar',{timeout:90000});
  await page.addStyleTag({path:'snippets/leave-workforce-v1.css'});
  await page.addScriptTag({path:'snippets/leave-workforce-v1.js'});
  await page.locator('#sidebar button').filter({hasText:'ตารางวันหยุด'}).click();
  await page.waitForSelector('#tab-schedule.active .lv-day');
  await page.locator('#tab-schedule.active .lv-day[onclick^="lvOpenDay"]').first().click();
  await page.waitForSelector('#lv-modal.open');

  const header=await page.evaluate(()=>({
    title:document.getElementById('lv-mtitle').textContent,
    cycle:document.getElementById('lv-mcycle').textContent,
    background:getComputedStyle(document.querySelector('#lv-modal .lv-mhead')).backgroundColor,
    hasHeaderRule:[...document.styleSheets].some(sheet=>{try{return [...sheet.cssRules].some(rule=>rule.cssText.includes('#lv-modal .lv-mhead'))}catch(error){return false}}),
    extraHeaderButtons:document.querySelectorAll('#lv-modal .lv-mhead>button:not(.lv-mclose)').length,
    addTitle:document.querySelector('#lv-modal .lv-add-title').textContent.trim(),
    closeLabel:document.querySelector('#lv-modal .lv-mclose').getAttribute('aria-label'),
    closeIcon:!!document.querySelector('#lv-modal .lv-mclose .lv-mclose-icon'),
    closePath:getComputedStyle(document.querySelector('#lv-modal .lv-mclose-icon path')).stroke
  }));
  assert.match(header.title,/^📅 วัน/);
  assert.match(header.cycle,/^รอบ: 26 /);
  assert.ok(header.hasHeaderRule,`header stylesheet missing: ${JSON.stringify(header)}`);
  assert.strictEqual(header.background,'rgb(23, 77, 58)');
  assert.strictEqual(header.extraHeaderButtons,0);
  assert.strictEqual(header.addTitle,'เพิ่มการลา');
  assert.strictEqual(header.closeLabel,'ปิด');
  assert.strictEqual(header.closeIcon,true);
  assert.strictEqual(header.closePath,'rgb(255, 115, 123)');

  await page.selectOption('#lv-f-emp','wiw');
  await page.selectOption('#lv-f-type','vac');
  await page.click('#lv-f-save');
  await page.waitForSelector('#lv-modal:not(.open)',{state:'hidden'});
  assert.deepStrictEqual(errors,[],`browser errors: ${errors.join(' | ')}`);
  console.log('leave modal header and save-close passed');
  await browser.close();
})().catch(error=>{console.error(error);process.exit(1);});
