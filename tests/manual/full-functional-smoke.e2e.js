const { chromium }=require('playwright');
const assert=require('assert');

(async()=>{
  const targetUrl=process.argv[2]||'http://127.0.0.1:8011/index.html?v=fix241-functional';
  const screenshotPath=process.argv[3]||'';
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  const context=await browser.newContext();
  await context.addInitScript(()=>{
    localStorage.setItem('rb_session',JSON.stringify({name:'View',role:'sup',expiresAt:Date.now()+3600000}));
    localStorage.setItem('rb_theme','dark');
  });
  await context.route(/firebaseio\.com/,route=>route.abort('blockedbyclient'));
  await context.route(/docs\.google\.com\/spreadsheets/,route=>route.fulfill({status:200,contentType:'text/csv; charset=utf-8',body:'ชื่อเพจ,สินค้า,สถานะ,พนักงาน,Facebook ID\nเพจทดสอบ,Liv CARE,ใช้งาน,MOS,10001'}));
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error'&&!/Failed to load resource/.test(message.text()))errors.push(message.text());});
  await page.goto(targetUrl,{waitUntil:'commit',timeout:60000});
  await page.waitForSelector('#sidebar',{timeout:90000});
  for(let i=0;i<180;i++){
    if(await page.evaluate(()=>typeof window._icInit==='function'&&document.body&&getComputedStyle(document.body).backgroundColor==='rgb(2, 7, 8)'))break;
    await page.waitForTimeout(500);
    if(i===179)throw new Error('page runtime did not become ready');
  }
  const themeDiagnostic=await page.evaluate(()=>({theme:document.documentElement.getAttribute('data-theme'),bodyStyle:document.body.getAttribute('style'),themeCss:!!document.getElementById('rb-dark-theme-deep-teal-v1'),background:getComputedStyle(document.body).backgroundColor}));
  assert.strictEqual(themeDiagnostic.background,'rgb(2, 7, 8)',`Deep Teal page background must be active: ${JSON.stringify(themeDiagnostic)}`);

  const sidebarCases=[
    ['Home','#tab-overview'],
    ['Product brand','#tab-brands'],
    ['Graphic','#tab-team'],
    ['ตารางวันหยุด','#tab-schedule'],
    ['Social Media','#tab-channels']
  ];
  for(const [label,target] of sidebarCases){
    await page.locator('#sidebar button').filter({hasText:label}).click();
    await page.locator(target).waitFor({state:'visible'});
  }

  await page.locator('#sidebar button').filter({hasText:'Graphic'}).click();
  await page.waitForSelector('#tab-team.active');
  const graphicCases=[
    ['ทีมงาน','team'],['สั่งงาน','order'],['รวมลิงก์','links'],['ค่าคอมมิชชั่น','commission'],
    ['ยอดหักออดิต','audit'],['Facebook Pages','fblist'],['List Facebook','listfb'],['บัตรประชาชน','idcard']
  ];
  for(const [label,key] of graphicCases){
    const button=page.locator('.gsnav-btn').filter({hasText:label});
    await button.click();
    await page.waitForTimeout(180);
    assert.match(await button.getAttribute('class'),/gsnav-active/,`${label} tab must become active`);
    assert.strictEqual(await page.locator(`.gsp[data-sub="${key}"]`).isVisible(),true,`${label} panel must be visible`);
  }

  await page.locator('.gsnav-btn').filter({hasText:'สั่งงาน'}).click();
  await page.locator('.ord-tab-btn').filter({hasText:'ทีมงาน'}).click();
  assert.strictEqual(await page.locator('.ord-tab-btn').filter({hasText:'ทีมงาน'}).evaluate(el=>el.style.fontWeight),'700','Active order tab must remain visibly selected');
  await page.locator('#ord-add-btn').click();
  assert.strictEqual(await page.locator('#om-primary-btn').isEnabled(),true,'Supervisor order button must be enabled');
  await page.getByRole('button',{name:'ปิด'}).last().click();
  await page.waitForTimeout(100);
  if(screenshotPath)await page.screenshot({path:screenshotPath,fullPage:false});

  assert.deepStrictEqual(errors,[],`browser errors: ${errors.join(' | ')}`);
  console.log('full functional smoke: all clickable navigation passed');
  await browser.close();
})().catch(error=>{console.error(error);process.exit(1);});
