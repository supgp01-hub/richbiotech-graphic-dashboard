const {chromium}=require('playwright');
const assert=require('assert');

(async()=>{
  const targetUrl=process.argv[2]||'http://127.0.0.1:8014/index.html?v=fix242-mobile';
  const screenshotPath=process.argv[3]||'';
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  const context=await browser.newContext({viewport:{width:390,height:844}});
  await context.addInitScript(()=>{
    localStorage.setItem('rb_session',JSON.stringify({name:'วิว',role:'sup',expiresAt:Date.now()+3600000}));
    localStorage.setItem('rb_theme','dark');
  });
  await context.route(/firebaseio\.com/,route=>route.abort('blockedbyclient'));
  await context.route(/docs\.google\.com\/spreadsheets/,route=>route.fulfill({status:200,contentType:'text/csv; charset=utf-8',body:'ชื่อเพจ,สินค้า,สถานะ,พนักงาน,Facebook ID\nเพจทดสอบ,Liv CARE,ใช้งาน,MOS,10001'}));
  await context.route('https://**',route=>route.abort('blockedbyclient'));
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(targetUrl,{waitUntil:'commit',timeout:60000});
  await page.waitForFunction(()=>document.body&&getComputedStyle(document.body).backgroundColor==='rgb(2, 7, 8)',null,{timeout:90000});
  await page.waitForSelector('#sidebar',{state:'attached',timeout:90000});
  await page.locator('#sidebar button').filter({hasText:'Graphic'}).evaluate(el=>el.click());
  await page.waitForSelector('#tab-team.active');
  await page.locator('.gsnav-btn').filter({hasText:'สั่งงาน'}).click();
  await page.locator('.ord-tab-btn').filter({hasText:'ทีมงาน'}).click();
  await page.locator('#ord-add-btn').click();
  await page.waitForSelector('#rb-order-modal',{state:'visible'});
  const layout=await page.locator('#rb-order-modal').evaluate(el=>{const r=el.getBoundingClientRect();return{left:r.left,right:r.right,width:r.width,viewport:document.documentElement.clientWidth,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};});
  assert.ok(layout.left>=0&&layout.right<=layout.viewport+1,`Order modal must fit the mobile viewport: ${JSON.stringify(layout)}`);
  assert.ok(layout.overflow<=1,`Dark mobile page must not overflow horizontally: ${JSON.stringify(layout)}`);
  assert.strictEqual(await page.getByRole('button',{name:'ปิด'}).last().isVisible(),true,'Close action must stay visible on mobile');
  if(screenshotPath)await page.screenshot({path:screenshotPath,fullPage:false});
  assert.deepStrictEqual(errors,[],`mobile browser errors: ${errors.join(' | ')}`);
  await browser.close();
  console.log('dark theme mobile: layout and controls passed');
})().catch(error=>{console.error(error);process.exit(1);});
