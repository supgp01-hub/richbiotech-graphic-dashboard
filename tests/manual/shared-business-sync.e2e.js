const {chromium}=require('playwright');
const assert=require('node:assert/strict');

function parts(path){return String(path||'').split('/').filter(Boolean);}
function get(root,path){let value=root;for(const part of parts(path)){if(!value||typeof value!=='object')return null;value=value[part];}return value==null?null:JSON.parse(JSON.stringify(value));}
function set(root,path,value){const keys=parts(path);let cursor=root;for(let i=0;i<keys.length-1;i++){if(!cursor[keys[i]]||typeof cursor[keys[i]]!=='object')cursor[keys[i]]={};cursor=cursor[keys[i]];}if(value===null)delete cursor[keys[keys.length-1]];else cursor[keys[keys.length-1]]=JSON.parse(JSON.stringify(value));}

(async()=>{
  const url=process.argv[2]||'http://127.0.0.1:8014/tests/fixtures/shared-business-sync.html';
  const server={};
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  const context=await browser.newContext();
  await context.exposeFunction('testCloudSet',async(path,value)=>{set(server,path,value);return true;});
  await context.exposeFunction('testCloudGet',async path=>get(server,path));
  await context.addInitScript(()=>{
    localStorage.setItem('rb_brand_pages_v1',JSON.stringify({SO_PINK:[{name:'เพจจาก User A',status:0}]}));
    localStorage.setItem('rb_fb_notif',JSON.stringify({'เพจจาก User A':'2'}));
  });
  const page=await context.newPage();
  await page.goto(url,{waitUntil:'load'});
  await page.waitForFunction(()=>window.rbSharedBusinessSync&&Object.keys(window.rbSharedBusinessSync.descriptors).length===6);
  for(let i=0;i<50&&!get(server,'/brand_pages_v1');i++)await new Promise(resolve=>setTimeout(resolve,100));
  if(!get(server,'/brand_pages_v1'))console.log('local snapshot',await page.evaluate(()=>localStorage.getItem('rb_brand_pages_v1')));
  if(!get(server,'/brand_pages_v1/SO_PINK'))console.log('server snapshot',JSON.stringify(server));
  assert.equal(get(server,'/brand_pages_v1/SO_PINK')!==null,true,'first user records must reach the online store');
  assert.equal(get(server,'/facebook_notifications')!==null,true,'notification changes must reach the online store');

  await context.close();
  const second=await browser.newContext();
  await second.exposeFunction('testCloudSet',async(path,value)=>{set(server,path,value);return true;});
  await second.exposeFunction('testCloudGet',async path=>get(server,path));
  const secondPage=await second.newPage();
  await secondPage.goto(url,{waitUntil:'load'});
  await secondPage.waitForFunction(()=>{const value=JSON.parse(localStorage.getItem('rb_brand_pages_v1')||'{}');return value.SO_PINK&&value.SO_PINK.some(row=>row.name==='เพจจาก User A');});
  const restored=await secondPage.evaluate(()=>JSON.parse(localStorage.getItem('rb_brand_pages_v1')));
  assert.equal(restored.SO_PINK[0].name,'เพจจาก User A','a refresh/new session must restore business data from online');
  console.log('shared business sync e2e: online write and refresh restore passed');
  await second.close();
  await browser.close();
})().catch(error=>{console.error(error);process.exit(1);});
