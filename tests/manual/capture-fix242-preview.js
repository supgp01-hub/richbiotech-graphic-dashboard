const {chromium}=require('playwright');
const path=require('path');

(async()=>{
  const target=process.argv[2]||'http://127.0.0.1:8014/index.html?v=fix242-preview';
  const output=path.resolve(process.argv[3]||'fix242-revision-detail-preview.png');
  const order={
    id:'GR021',name:'พิธีกรสัมภาษณ์คนเมา WOLF+3',product:'WOLF+',type:'ยิงแอด',
    deadline:'2026-08-25',status:'revision',assignee:'BALL',hook:'ทำไมต้องเลือกเรา?',hook2:'คำตอบใน 7 วินาที',
    brief:'Noedit ขนาด 4:5 ยิง 1 ฮุก 2 ปก 1 เพจ ยิงแบบ 1:1:1 ใส่เงิน 200',
    note:'แก้ข้อความช่วงเปิดและเพิ่มภาพสินค้าให้ชัดขึ้น',
    rawLink:'https://drive.google.com/drive/folders/creative-reference',sheetLink:'https://docs.google.com/spreadsheets/d/script-reference',
    footageLink:'https://drive.google.com/drive/folders/footage-folder',reviewLink:'https://drive.google.com/drive/folders/review-folder',
    submitLinks:['https://drive.google.com/drive/folders/original-delivery'],createdAt:Date.now(),updatedAt:Date.now()
  };
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  const context=await browser.newContext({viewport:{width:1180,height:1800},deviceScaleFactor:1});
  await context.addInitScript(order=>{
    localStorage.setItem('rb_session',JSON.stringify({name:'Ball',role:'graphic',expiresAt:Date.now()+3600000}));
    localStorage.setItem('rb_orders_v1',JSON.stringify([order]));
    localStorage.setItem('rb_theme','dark');
  },order);
  await context.route(/firebaseio\.com/,route=>route.abort('blockedbyclient'));
  await context.route('https://**',route=>route.abort('blockedbyclient'));
  const page=await context.newPage();
  await page.goto(target,{waitUntil:'commit',timeout:60000});
  await page.waitForFunction(()=>typeof window.openOM==='function',null,{timeout:90000});
  await page.evaluate(()=>{window._ordViewMode='team';window.openOM('GR021');});
  await page.waitForSelector('#rb-order-modal.rb-revision-detail-mode',{state:'visible'});
  await page.locator('.rb-om-body').evaluate(el=>{el.scrollTop=0;});
  await page.evaluate(()=>{const w=document.querySelector('#rb-order-modal .rb-om-window'),b=document.querySelector('#rb-order-modal .rb-om-body');if(w){w.style.maxHeight='none';w.style.height='auto';}if(b){b.style.overflow='visible';b.style.maxHeight='none';}});
  await page.locator('#rb-order-modal .rb-om-window').screenshot({path:output});
  await browser.close();
  console.log(output);
})().catch(error=>{console.error(error);process.exit(1);});
