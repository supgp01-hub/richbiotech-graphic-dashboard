const {chromium}=require('playwright');
const assert=require('assert');
const {installSecureAuthMock}=require('./secure-auth-mock');

(async()=>{
  const target=process.argv[2]||'http://127.0.0.1:8014/';
  const now=Date.now();
  const orders=Array.from({length:13},(_,index)=>({
    id:'GR'+String(700+index),_fbKey:'qa_dom_'+index,name:'Dom workload '+(index+1),
    product:'So Pink',type:'กราฟิก',deadline:'2026-09-03',
    status:index<3?'review':'done',assignee:'DOM',createdAt:now-index,updatedAt:now-index
  }));
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  const context=await browser.newContext({serviceWorkers:'block'});
  await installSecureAuthMock(context,{role:'graphic',name:'Dom',orders});
  await context.addInitScript(rows=>localStorage.setItem('rb_orders_v1',JSON.stringify(rows)),orders);
  const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(target,{waitUntil:'commit',timeout:60000});
  await page.waitForFunction(()=>typeof window._rbInitOP==='function'&&window._rbUser?.name==='Dom',null,{timeout:90000});
  await page.locator('#sidebar button').filter({hasText:'Graphic'}).click();
  await page.locator('.gsnav-btn').filter({hasText:'สั่งงาน'}).click();
  await page.waitForSelector('[data-sub="order"].gsp-active');
  await page.evaluate(()=>{window._OF.status='pending';window._OF.dl='';window._OF.activeCard='pending';window._rbInitOP();});
  await page.waitForFunction(()=>document.querySelectorAll('#ord-tw tbody tr').length===13);
  const result=await page.evaluate(()=>({
    rows:document.querySelectorAll('#ord-tw tbody tr').length,
    summary:document.getElementById('ord-result-summary')?.textContent||'',
    status:window._OF.status,activeCard:window._OF.activeCard,
    disabled:Array.from(document.querySelectorAll('#ord-stats > div')).find(el=>el.textContent.includes('มอบหมาย'))?.getAttribute('aria-disabled')
  }));
  assert.equal(result.rows,13);
  assert.match(result.summary,/แสดง 13 จาก 13 งานของฉัน/);
  assert.equal(result.status,'');assert.equal(result.activeCard,'all');assert.equal(result.disabled,'true');
  assert.deepStrictEqual(errors,[],'employee workload must render without JavaScript errors');
  await context.close();await browser.close();
  console.log('order-viewer-zero-filter: all 13 assigned Dom jobs remain visible');
})().catch(error=>{console.error(error);process.exit(1);});
