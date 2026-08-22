const {chromium}=require('playwright');
const assert=require('assert');

const seedOrder={id:'GR901',_fbKey:'qa_role_order',name:'Role action test',product:'Liv CARE',type:'กราฟิก',deadline:'2026-08-23',status:'pending',assignee:'DOM',note:'',createdAt:Date.now(),updatedAt:Date.now()};

async function exercise(browser,role,name){
  const context=await browser.newContext();
  await context.addInitScript(({role,name,seedOrder})=>{
    localStorage.setItem('rb_session',JSON.stringify({name,role,expiresAt:Date.now()+3600000}));
    localStorage.setItem('rb_orders_v1',JSON.stringify([seedOrder]));
  },{role,name,seedOrder});
  await context.route(/firebaseio\.com/,route=>route.abort('blockedbyclient'));
  await context.route(/docs\.google\.com\/spreadsheets/,route=>route.fulfill({status:200,contentType:'text/csv; charset=utf-8',body:'ชื่อเพจ,สินค้า,สถานะ,พนักงาน,Facebook ID\nเพจทดสอบ,Liv CARE,ใช้งาน,DOM,10001'}));
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`http://127.0.0.1:8011/index.html?v=fix233-${role}`,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#sidebar');
  if(role==='ads'){
    await page.locator('#tab-schedule').waitFor({state:'visible'});
    assert.deepStrictEqual(errors,[]);
    await context.close();return;
  }
  await page.locator('#sidebar button').filter({hasText:'Graphic'}).click();
  await page.waitForSelector('#tab-team.active');
  await page.locator('.gsnav-btn').filter({hasText:'สั่งงาน'}).click();
  await page.waitForSelector('[data-sub="order"].gsp-active');
  await page.waitForTimeout(250);
  assert.ok(await page.getByText('GR901',{exact:true}).count()>=1,`${role} must see the assigned test order`);
  const editButtons=page.getByRole('button',{name:'แก้ไขงาน'});
  assert.ok(await editButtons.count()>=1,`${role} must have an order action`);
  await editButtons.first().click();
  await page.waitForSelector('#om-primary-btn',{state:'attached'});
  if(role==='audit'){
    await page.getByRole('button',{name:'ตรวจออดิต'}).last().click();
    await page.getByRole('button',{name:'เสร็จสมบูรณ์'}).click();
    const status=await page.evaluate(()=>JSON.parse(localStorage.getItem('rb_orders_v1'))[0].status);
    assert.strictEqual(status,'done','Audit must be able to approve an order');
  }else{
    await page.locator('#om-primary-btn').click();
    await page.waitForTimeout(200);
    assert.strictEqual(await page.locator('#om-primary-btn').isVisible(),false,`${role} action must close the modal`);
    if(role==='graphic'){
      const status=await page.evaluate(()=>JSON.parse(localStorage.getItem('rb_orders_v1'))[0].status);
      assert.strictEqual(status,'inprogress','Graphic user must be able to start assigned work');
    }
  }
  assert.deepStrictEqual(errors,[],`${role} browser errors: ${errors.join(' | ')}`);
  await context.close();
}

(async()=>{
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  for(const [role,name] of [['sup','View'],['spec','Moss'],['graphic','Dom'],['audit','Nui'],['ads','Mind']])await exercise(browser,role,name);
  await browser.close();
  console.log('order role actions: all user roles passed');
})().catch(error=>{console.error(error);process.exit(1);});
