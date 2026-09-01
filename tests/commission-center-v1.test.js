const assert=require('assert');
const fs=require('fs');
const path=require('path');

const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'snippets','commission-center-v1.js'),'utf8');
const css=fs.readFileSync(path.join(root,'snippets','commission-center-v1.css'),'utf8');

assert.ok(html.includes('commission-center-v1.css?v=fix310'),'commission stylesheet must be loaded');
assert.ok(html.includes('commission-center-v1.js?v=fix310'),'commission runtime must be loaded');
assert.ok(js.includes("if(r==='audit')return'audit'"),'Audit must have its own entry view');
assert.ok(js.includes("if(r==='graphic'||r==='ads')return'staff'"),'Graphic and Ads must have personal view');
assert.ok(js.includes('function enforceAdsAccess()'),'Ads users must be able to open the commission tab');
assert.ok(js.includes("return'supervisor'"),'Supervisor must have team view');
assert.ok(js.includes("CLOUD_STORE='/commission_center_v1'"),'commission edits must persist to shared storage');
assert.ok(js.includes('data-cc-action="save-audit"'),'Audit must be able to save ad-spend rows');
assert.ok(js.includes('data-cc-action="toggle-lock"'),'Supervisor must be able to lock a period');
assert.ok(js.includes('คุณเห็นเฉพาะข้อมูลของตัวเอง'),'staff view must explain personal-only access');
assert.ok(js.includes('พนักงาน + วันที่ + สินค้า'),'duplicate protection must be visible');
assert.ok(js.includes('function commissionForAds(value)'),'new Audit entries must use the daily ad-spend tier rule');
assert.ok(js.includes('function parseReference(html)'),'a public read-only source must back up the Google Sheet connection');
assert.ok(css.includes('@media(max-width:700px)'),'commission page must support mobile layouts');
console.log('commission center static contract: passed');
