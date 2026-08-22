const { chromium }=require('playwright');
const assert=require('assert');

(async()=>{
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  const context=await browser.newContext();
  await context.addInitScript(()=>{
    localStorage.setItem('rb_session',JSON.stringify({name:'วิว',role:'sup',expiresAt:Date.now()+3600000}));
  });
  await context.route(/firebaseio\.com/,route=>route.abort('blockedbyclient'));
  await context.route(/docs\.google\.com\/spreadsheets/,route=>route.fulfill({status:200,contentType:'text/csv; charset=utf-8',body:'ชื่อเพจ,สินค้า,สถานะ,พนักงาน,Facebook ID\nเพจทดสอบ,Liv CARE,ใช้งาน,MOS,10001'}));
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error'&&!/Failed to load resource/.test(message.text()))errors.push(message.text());});
  await page.goto('http://127.0.0.1:8011/index.html?v=fix233-functional',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#sidebar');

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
  await page.locator('#ord-add-btn').click();
  assert.strictEqual(await page.locator('#om-primary-btn').isEnabled(),true,'Supervisor order button must be enabled');
  await page.getByRole('button',{name:'ปิด'}).last().click();
  await page.waitForTimeout(100);

  assert.deepStrictEqual(errors,[],`browser errors: ${errors.join(' | ')}`);
  console.log('full functional smoke: all clickable navigation passed');
  await browser.close();
})().catch(error=>{console.error(error);process.exit(1);});
