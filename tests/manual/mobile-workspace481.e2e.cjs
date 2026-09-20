const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {installSecureAuthMock}=require('./secure-auth-mock');
(async()=>{const browser=await chromium.launch({headless:true,channel:process.env.RB_TEST_BROWSER_CHANNEL||'chrome'}),root=path.resolve(__dirname,'../..');try{
const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});let reads=0,fail=false;
await ctx.route('**/*',r=>{const u=new URL(r.request().url()),f=path.resolve(root,'.'+u.pathname);return u.origin==='http://127.0.0.1:8014'&&f.startsWith(root+path.sep)&&fs.existsSync(f)?r.fulfill({path:f}):r.abort();});
const orders={qa:{id:'GR900',name:'งานทดสอบข้อความยาวสำหรับมือถือ',assignee:'JAM',status:'review',deadline:'2026-09-25',type:'ยิงแอด'}};
await installSecureAuthMock(ctx,{role:'sup',name:'View'});
await ctx.route(/firebaseio\.com\/orders\.json/,r=>{reads++;return fail?r.abort():r.fulfill({json:orders});});
await ctx.route(/firebaseio\.com\/content_tracker_v2\.json/,r=>r.fulfill({json:{items:[{id:'mobile-hook',brand:'So Pink',episode:'ข้อความตัวอย่างบนมือถือที่ต้องเห็นครบทุกช่อง',ready:'HOOK ทดสอบ',script:'https://example.test/script'}]}}));
await ctx.route(/firebaseio\.com\/listfacebook_base_snapshot\.json/,r=>r.fulfill({json:{items:[{name:'บัญชีตัวอย่างบนมือถือ',fbid:'qa-mobile',emp:'JAM',prod:'So Pink',st:'ใช้งาน',type:'บัญชีเล็ก'}],schemaVersion:5,updatedAt:Date.now()}}));
await ctx.addInitScript(()=>localStorage.setItem('rb_fbpages_cache_v1',JSON.stringify([{name:'ขุนแผน คืนพลังชาย โทร.02-124-3032',prod:'ขุนแผน',st:'ใช้งาน',own:'BALL',pageId:'1'}])));
const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:8014/index.html',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window._rbUser?.uid&&window._icInit);
async function fits(name){await p.waitForTimeout(160);const overflow=await p.evaluate(()=>Array.from(document.querySelectorAll('main *')).filter(e=>{if(e.closest('thead'))return false;const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width&&r.height&&s.visibility!=='hidden'&&s.position!=='fixed'&&(r.right>innerWidth+2||r.left < -2);}).slice(0,6).map(e=>({tag:e.tagName,id:e.id,cls:String(e.className),right:e.getBoundingClientRect().right})));assert.deepEqual(overflow,[],name+' content needs horizontal scrolling');}
async function section(key){await p.locator(`#sidebar button[onclick*="'${key}'"]`).evaluate(e=>e.click());}
async function sub(label){const keys={'ทีมงาน':'team','สั่งงาน':'order','รวมลิงก์':'links','ค่าคอมมิชชั่น':'commission','ยอดหักออดิต':'audit','Facebook Pages':'fblist','List Facebook':'listfb','บัตรประชาชน':'idcard'};if(p.viewportSize().width<=900){await p.locator('[data-mobile-nav="menu"]').click();await p.locator('[data-mobile-destination="'+keys[label]+'"]').click();}else await p.locator('.gsnav-btn').filter({hasText:label}).click();}
for(const width of [320,390,430,760,844,900]){
 await p.setViewportSize({width,height:844});
 for(const key of ['overview','brands','channels','schedule','team']){await section(key);await fits(key+' '+width);}
 for(const label of ['ทีมงาน','สั่งงาน','รวมลิงก์','ค่าคอมมิชชั่น','ยอดหักออดิต','Facebook Pages','List Facebook','บัตรประชาชน']){await sub(label);await fits(label+' '+width);}
}
await p.setViewportSize({width:390,height:844});await section('team');await sub('รวมลิงก์');
await p.locator('[data-ctg-toggle="mobile-hook"]').click();await p.locator('.ctg-detail').waitFor();await fits('expanded content');assert.ok(await p.locator('.ctg-employees td[data-mobile-label]').count()>0,'nested employee details keep column labels');
await p.locator('.ctg-main').screenshot({path:path.resolve(root,'../mobile481-content-card.png')});
await sub('List Facebook');await p.locator('#lfb-add').click();await p.locator('#lfbe-name').fill('แบบร่างที่ยังไม่บันทึก');
const input=p.locator('#lfbe-name');assert.ok(await input.evaluate(e=>parseFloat(getComputedStyle(e).fontSize)>=16),'iOS focused inputs should not trigger automatic zoom');
await p.locator('#lfbe-prod').click();await p.locator('#rb-dd-popover').waitFor({state:'visible'});assert.ok(await p.locator('#rb-dd-popover').evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1;}));await p.locator('#rb-dd-popover .rb-dd-option').first().press('Escape');
await p.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));const before=reads;
await p.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));await p.waitForFunction(()=>document.querySelector('#lfbe-name')?.value==='แบบร่างที่ยังไม่บันทึก');await p.waitForTimeout(400);assert.ok(reads>before,'bfcache return fetches current server data');assert.equal(await input.inputValue(),'แบบร่างที่ยังไม่บันทึก');
fail=true;await p.evaluate(()=>window.dispatchEvent(new Event('offline')));assert.equal(await input.inputValue(),'แบบร่างที่ยังไม่บันทึก');fail=false;await p.evaluate(()=>window.dispatchEvent(new Event('online')));await p.waitForTimeout(500);assert.equal(await input.inputValue(),'แบบร่างที่ยังไม่บันทึก');
await p.locator('#lfb-editor-overlay button').filter({hasText:'ยกเลิก'}).click();
await section('schedule');await p.evaluate(()=>{LV_CUR={y:2026,m:4};LV_DATA={'2026-4-13':[{uid:1,empId:'jam',type:'hol'},{uid:2,empId:'ter',type:'vac'},{uid:3,empId:'dom',type:'hol'}]};lvRender();});await fits('calendar with leave');
await p.locator('#rb-mobile-calendar-view').selectOption('list');await fits('daily calendar');assert.equal(await p.locator('#lv-cal-body').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length),1);assert.equal(await p.locator('#lv-cal-body [data-emp]').count(),3);
await p.locator('[data-lvw-date="2026-4-13"]').scrollIntoViewIfNeeded();await p.screenshot({path:path.resolve(root,'../mobile481-daily-calendar.png')});
await p.locator('#rb-mobile-calendar-view').selectOption('month');await p.evaluate(()=>document.documentElement.setAttribute('data-theme','dark'));await fits('dark calendar');
await section('team');await sub('สั่งงาน');await p.locator('#ord-add-btn').click();assert.ok(await p.locator('#rb-order-modal .rb-om-window').evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1}));await p.getByRole('button',{name:'ปิด',exact:true}).last().click();
await p.setViewportSize({width:1280,height:900});await sub('รวมลิงก์');assert.equal(await p.locator('.ct-table').evaluate(e=>getComputedStyle(e).display),'table','desktop layout restored after rotation/resize');
assert.deepEqual(errors,[]);console.log('PASS mobile 320/390/430/760, all main screens, populated/nested cards, controls, drafts, bfcache resume, reconnect, calendar modes, dark mode and desktop restoration');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
