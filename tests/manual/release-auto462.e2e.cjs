const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const script=fs.readFileSync(path.resolve(__dirname,'../../snippets/release-update-v1.js'),'utf8');
(async()=>{const browser=await chromium.launch({headless:true,channel:process.env.RB_TEST_BROWSER_CHANNEL||'chrome'});try{
 let build='fix9000',htmlBuild=build,holdProbe=false,releaseProbe,probeSeen,probes=0;const errors=[];
 async function device(){const ctx=await browser.newContext();await ctx.route('**/*',async r=>{
  const u=new URL(r.request().url());if(u.origin!=='http://release.test')return r.abort();
  if(u.pathname==='/release.json')return r.fulfill({json:{build}});
  if(u.searchParams.has('_rb_probe')){probes++;if(holdProbe){holdProbe=false;await new Promise(resolve=>{releaseProbe=resolve;probeSeen();});}}
  return r.fulfill({contentType:'text/html; charset=utf-8',body:'<meta charset="utf-8"><meta name="rb-build" content="'+htmlBuild+'"><input id="ct-search"><textarea id="draft"></textarea><script>'+script+'</script>'});
 });const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));await page.clock.install();await page.goto('http://release.test/index.html?keep=1#links');return{ctx,page};}
 async function tick(d,ms=4000){await d.page.clock.runFor(ms);}
 // Two independent devices discover the release by their own timers, even hidden.
 const a=await device(),b=await device();await b.page.locator('#draft').fill('ยังไม่บันทึก');
 await a.page.evaluate(()=>Object.defineProperty(document,'hidden',{configurable:true,get:()=>true}));
 build=htmlBuild='fix9001';await tick(a,10000);await tick(b,10000);
 await a.page.locator('#rb-release-update').waitFor();await b.page.locator('#rb-release-update').waitFor();await tick(a);await tick(b);
 await a.page.waitForURL('**__rb_release=fix9001#links');assert.equal(new URL(a.page.url()).searchParams.get('keep'),'1');
 assert(!b.page.url().includes('__rb_release'));assert.equal(await b.page.locator('#draft').inputValue(),'ยังไม่บันทึก');
 await b.page.evaluate(()=>window.dispatchEvent(new CustomEvent('rb:sync-state',{detail:{state:'saved'}})));await tick(b);assert(!b.page.url().includes('__rb_release'));
 await b.page.evaluate(()=>window.rbReleaseUpdate.confirmSaved(document.querySelector('#draft'),'ยังไม่บันทึก'));await tick(b,6000);await b.page.waitForURL('**__rb_release=fix9001#links');
 // A manifest published ahead of its HTML must not cause a stale reload loop.
 const c=await device();build='fix9002';await c.page.evaluate(()=>window.rbReleaseUpdate.check());await tick(c,5000);await c.page.getByText(/กำลังรอไฟล์เวอร์ชัน/).waitFor().catch(async err=>{console.log('stale probe',probes,c.page.url(),await c.page.locator('body').innerText());throw err;});assert(!c.page.url().includes('__rb_release'));
 htmlBuild=build;await tick(c,31000);await c.page.waitForURL('**__rb_release=fix9002#links');
 // Content queue and an active direct save both block; offline never reloads.
 const d=await device();await d.page.evaluate(()=>{localStorage.setItem('rb_ct_sync_pending_v1','1');window.ctSubmissions={pendingCount:()=>1};});build=htmlBuild='fix9003';await d.page.evaluate(()=>window.rbReleaseUpdate.check());await tick(d,5000);assert(!d.page.url().includes('__rb_release'));
 await d.page.evaluate(()=>localStorage.removeItem('rb_ct_sync_pending_v1'));await tick(d);assert(!d.page.url().includes('__rb_release'));
 await d.ctx.setOffline(true);await d.page.evaluate(()=>window.ctSubmissions.pendingCount=()=>0);await tick(d);assert(!d.page.url().includes('__rb_release'));
 await d.ctx.setOffline(false);await d.page.locator('#rb-release-update').waitFor();await tick(d,6000);await d.page.waitForURL('**__rb_release=fix9003#links');
 // A new edit arriving while the deployment probe is in flight cancels reload.
 await Promise.all([a.ctx.close(),b.ctx.close(),c.ctx.close(),d.ctx.close()]);
 const e=await device(),probeStarted=new Promise(resolve=>probeSeen=resolve);build=htmlBuild='fix9004';holdProbe=true;await e.page.evaluate(()=>window.rbReleaseUpdate.check());await tick(e,5000);await Promise.race([probeStarted,new Promise((_,reject)=>setTimeout(()=>reject(Error('probe was not started')),5000))]);await e.page.locator('#draft').fill('typed during version check');releaseProbe();await tick(e,4000);assert(!e.page.url().includes('__rb_release'));assert.equal(await e.page.locator('#draft').inputValue(),'typed during version check');
 assert.deepEqual(errors,[]);console.log('PASS automatic multi-device/background discovery; exact-field save deferral; stale CDN HTML retry; content queues; offline reconnect; edits during probe; URL preservation');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
