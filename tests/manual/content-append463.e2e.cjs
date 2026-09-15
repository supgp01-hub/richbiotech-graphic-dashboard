const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {installSecureAuthMock}=require('./secure-auth-mock');
(async()=>{const root=path.resolve(__dirname,'../..'),browser=await chromium.launch({headless:true,channel:process.env.RB_TEST_BROWSER_CHANNEL||'chrome'});try{
 let data={items:Array.from({length:2441},(_,i)=>({id:'old-'+i,brand:i<294?'THE LORD':'So Pink',episode:'เดิม '+i,ready:'ฮุกเดิม',script:'https://example.test/'+i}))},etag=1,writes=0;
 const old=JSON.parse(JSON.stringify(data.items)),errors=[];
 async function device(quota){const ctx=await browser.newContext();await ctx.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!=='http://127.0.0.1:8014')return r.abort();const f=path.resolve(root,'.'+u.pathname);return f.startsWith(root+path.sep)&&fs.existsSync(f)?r.fulfill({path:f}):r.fulfill({status:404,body:''});});await installSecureAuthMock(ctx,{role:'sup',name:'VIEW'});
  if(quota)await ctx.addInitScript(()=>{const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='rb_olympplus_v1'&&JSON.parse(v).length>10)throw new DOMException('Full','QuotaExceededError');return set.call(this,k,v);};});
  await ctx.route(/firebaseio\.com\/content_tracker_v2\.json/,async r=>{const req=r.request();if(req.method()==='PUT'){assert.equal(req.headers()['if-match'],'"'+etag+'"');data=req.postDataJSON();etag++;writes++;}return r.fulfill({headers:{'access-control-expose-headers':'ETag',ETag:'"'+etag+'"'},json:data});});
  const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());await page.goto('http://127.0.0.1:8014/index.html');await page.waitForFunction(()=>window._rbUser?.role==='sup'&&window._ctCloudRows?.length===2441);await page.locator('#sidebar button').filter({hasText:'Graphic'}).click();await page.locator('.gsnav-btn').filter({hasText:'รวมลิงก์'}).click();return{page,ctx};
 }
 const first=await device(true),second=await device(false);
 // Reproduce the eight-row stale local view shown before the five-row import.
 await first.page.evaluate(rows=>{localStorage.setItem('rb_olympplus_v1',JSON.stringify(rows));window._ctCloudRows=rows;window._ctData=rows;window.ctRender();},old.slice(0,8));
 await first.page.getByRole('button',{name:'นำเข้า CSV',exact:true}).click();
 const csv='สินค้า,สคริป,ชื่อตอน,ฮุก\n'+Array.from({length:5},(_,i)=>'THE LORD,https://example.test/new-'+i+',เพิ่มเติม TL '+(i+1)+',เลือกฮุกเอง').join('\n');
 await first.page.locator('#cti-file').setInputFiles({name:'append-five.csv',mimeType:'text/csv',buffer:Buffer.from(csv)});
 await first.page.getByRole('button',{name:'ตรวจสอบข้อมูล',exact:true}).click();await first.page.locator('#cti-brand').selectOption('THE LORD');await first.page.getByRole('button',{name:'ถัดไป',exact:true}).click();
 assert.equal(await first.page.locator('input[name="cti-mode"]:checked').inputValue(),'append');await first.page.locator('#cti-commit').click();await first.page.locator('#cti-bg').waitFor({state:'hidden',timeout:10000}).catch(async err=>{console.log({writes,online:data.items.length,errors},await first.page.locator('#cti-progress-text').innerText(),await first.page.evaluate(()=>({pending:window.ctPendingCount(),rows:window._ctCloudRows.length,role:window._rbUser.role})));throw err;});
 assert.equal(data.items.length,2446);assert.equal(writes,1);for(const row of old)assert.deepEqual(data.items.find(r=>r.id===row.id),row,'original row preserved');
 assert.equal(await first.page.evaluate(()=>window._ctCloudRows.length),2446,'current UI must retain acknowledged union');assert.equal(await first.page.evaluate(()=>window._ctData.length),2446);
 await first.page.getByRole('button',{name:'THE LORD (299)',exact:true}).click();await first.page.locator('#ct-search').fill('เพิ่มเติม TL');await first.page.locator('.ctg-main').filter({hasText:'เพิ่มเติม TL'}).first().waitFor();assert.equal(await first.page.locator('.ctg-main').filter({hasText:'เพิ่มเติม TL'}).count(),5);
 await second.page.evaluate(()=>window.ctCloudHydrate());await second.page.waitForFunction(()=>window._ctCloudRows.length===2446);
 await first.page.reload();await first.page.waitForFunction(()=>window._ctCloudRows?.length===2446);assert.deepEqual(errors,[]);
 console.log('PASS 2441 old + 5 appended = 2446 online/current UI/second device/reload; THE LORD 299; quota cache only 8; original rows unchanged');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
