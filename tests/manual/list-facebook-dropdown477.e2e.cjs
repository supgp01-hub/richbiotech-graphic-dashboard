const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {installSecureAuthMock}=require('./secure-auth-mock');
(async()=>{const browser=await chromium.launch({headless:true,channel:process.env.RB_TEST_BROWSER_CHANNEL||'chrome'});try{
const root=path.resolve(__dirname,'../..'),origin='http://127.0.0.1:8017',manual={},edits={},errors=[];
const rows=[{name:'Legacy fixture',fbid:'qa-fixture',emp:'Legacy Owner',prod:'Old Product',follow:'',st:'ใช้งาน',type:'บัญชีเล็ก'}];
async function device(){
 const ctx=await browser.newContext({viewport:{width:1280,height:1000}});
 await ctx.route('**/*',route=>{const u=new URL(route.request().url()),file=path.resolve(root,'.'+u.pathname);return u.origin===origin&&file.startsWith(root+path.sep)&&fs.existsSync(file)?route.fulfill({path:file}):route.abort()});
 await installSecureAuthMock(ctx,{role:'sup',name:'View'});
 await ctx.route(/docs\.google\.com.*export/,route=>{const col=new URL(route.request().url()).searchParams.get('range');return route.fulfill({contentType:'text/csv',body:{'G:G':'ชื่อบัญชี\nLegacy fixture','C:C':'พนักงาน\nLegacy Owner','V:V':'📌 แชร์บัญชีไหน\nShared fixture'}[col]});});
 await ctx.route(/firebaseio\.com\/listfacebook_base_snapshot\.json/,route=>route.fulfill({json:{items:rows,schemaVersion:5,updatedAt:Date.now()}}));
 await ctx.route(/firebaseio\.com\/listfacebook_manual(?:\/[^?]+)?\.json/,route=>{const req=route.request(),key=new URL(req.url()).pathname.split('/').pop().replace('.json','');if(req.method()!=='GET'){manual[key]=req.postDataJSON();return route.fulfill({json:manual[key]});}return route.fulfill({json:manual});});
 await ctx.route(/firebaseio\.com\/listfacebook_edits(?:\/[^?]+)?\.json/,route=>{const req=route.request(),key=new URL(req.url()).pathname.split('/').pop().replace('.json','');if(req.method()!=='GET'){edits[key]=req.postDataJSON();return route.fulfill({json:edits[key]});}return route.fulfill({json:edits});});
 const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
 await p.goto(origin+'/index.html',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window._rbUser?.name);
 await p.locator('#sidebar button').filter({hasText:'Graphic'}).click();await p.locator('.gsnav-btn').filter({hasText:'List Facebook'}).click();
 await p.waitForFunction(()=>window._listfbData?.some(r=>r.name==='Legacy fixture'));
 return p;
}
const p=await device();await p.locator('.lfb-shared-account').waitFor();assert.equal(await p.locator('.lfb-shared-account').innerText(),'แชร์บัญชีไหน: Shared fixture');
await p.locator('#lfb-q').fill('Shared fixture');assert.equal(await p.locator('#lfb-body .lfb-name-btn').innerText(),'Legacy fixture');await p.locator('#lfb-q').fill('');
for(const height of [850,1100]){await p.setViewportSize({width:1600,height});await p.waitForTimeout(100);const bounds=await p.locator('.lfb-hybrid-app').boundingBox();assert.ok(Math.abs(bounds.y+bounds.height-(height-16))<8,'workspace fills desktop height');const table=await p.locator('.lfb-hybrid-table-wrap').boundingBox();assert.ok(table.y+table.height>height-100 && table.y+table.height<height,'table uses spare vertical space');}
await p.setViewportSize({width:390,height:900});assert.equal(await p.locator('.lfb-shared-account').evaluate(e=>e.getBoundingClientRect().right<=innerWidth),true);await p.setViewportSize({width:1280,height:1000});await p.locator('#lfb-add').click();
const overlay=p.locator('#lfb-editor-overlay');await overlay.waitFor({state:'visible'});
for(const key of ['emp','prod']){assert.equal(await p.locator('#lfbe-'+key).evaluate(e=>e.tagName),'SELECT');assert.equal(await p.locator('#lfbe-'+key).inputValue(),'');}
assert.ok(await p.locator('#lfbe-prod option[value="SYNBIOME"]').count());assert.ok(await p.locator('#lfbe-prod option[value="Blink Blink"]').count());
await p.locator('#lfbe-name').fill('Dropdown QA fixture');await p.locator('#lfbe-sharedAccount').fill('Manual shared account');
// Use the deployed select enhancer if present, otherwise exercise the native select.
async function choose(id,value){const select=p.locator('#'+id);if(await select.isVisible()){await select.selectOption(value);}else{const control=p.locator('[data-select-id="'+id+'"]');if(await control.count()){await control.click();await p.getByText(value,{exact:true}).last().click();}else{throw new Error('No visible dropdown for '+id);}}}
await choose('lfbe-emp','TER');await choose('lfbe-prod','SYNBIOME');
await p.screenshot({path:path.resolve(root,'../list-facebook-dropdown477-desktop.png')});
await p.locator('#lfb-editor-save').click();await overlay.waitFor({state:'hidden'});
assert.equal(Object.values(manual).filter(r=>r.name==='Dropdown QA fixture').length,1);
assert.equal(Object.values(manual)[0].emp,'TER');assert.equal(Object.values(manual)[0].prod,'SYNBIOME');
assert.equal(Object.values(manual)[0].sharedAccount,'Manual shared account');
const b=await device();await b.waitForFunction(()=>window._listfbData?.some(r=>r.name==='Dropdown QA fixture'&&r.emp==='TER'&&r.prod==='SYNBIOME'));
await b.locator('#lfb-q').fill('Manual shared account');assert.equal(await b.locator('.lfb-shared-account').innerText(),'แชร์บัญชีไหน: Manual shared account');
await p.locator('#lfb-q').fill('Legacy fixture');await p.locator('#lfb-body .lfb-employee').click();
assert.equal(await p.locator('#lfbi-sharedAccount').inputValue(),'Shared fixture');
await p.locator('#lfbi-sharedAccount').fill('Edited share');await p.locator('#lfb-account-save').click();
await p.waitForFunction(()=>window._listfbData.some(r=>r.sharedAccount==='Edited share'));
assert.equal(Object.values(edits)[0].sharedAccount,'Edited share');
const c=await device();await c.locator('#lfb-q').fill('Legacy fixture');await c.locator('#lfb-body .lfb-employee').click();assert.equal(await c.locator('#lfbi-sharedAccount').inputValue(),'Edited share');
await c.locator('#lfbi-sharedAccount').fill('');await c.locator('#lfb-account-save').click();await c.waitForFunction(()=>window._listfbData.some(r=>r.name==='Legacy fixture'&&r.sharedAccount===''));assert.equal(Object.values(edits)[0].sharedAccount,'');
await c.reload();await c.waitForFunction(()=>window._listfbData?.some(r=>r.name==='Legacy fixture'&&r.sharedAccount===''));assert.equal(await c.locator('#lfb-body .lfb-shared-account').filter({hasText:'Shared fixture'}).count(),0,'explicit clear survives reload and sheet fallback');
await p.evaluate(()=>window._lfbOpenEditor(window._listfbData.find(r=>r.name==='Legacy fixture')._key));
assert.equal(await p.locator('#lfbe-emp').inputValue(),'Legacy Owner');assert.equal(await p.locator('#lfbe-prod').inputValue(),'Old Product');
await p.locator('.lfb-editor-close').click();await p.locator('#lfb-add').click();assert.equal(await p.locator('#lfbe-emp').inputValue(),'');
for(const width of [760,390]){await p.setViewportSize({width,height:900});assert.equal(await p.locator('.lfb-editor-modal').evaluate(e=>e.scrollWidth<=e.clientWidth+2),true,'modal fits at '+width);}
await p.evaluate(()=>document.documentElement.setAttribute('data-theme','dark'));await p.screenshot({path:path.resolve(root,'../list-facebook-dropdown477-mobile.png')});
assert.deepEqual(errors,[]);console.log('PASS create dropdowns, real UI selection, save, separate-browser read, legacy edit, blank reset, desktop/mobile and dark mode');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
