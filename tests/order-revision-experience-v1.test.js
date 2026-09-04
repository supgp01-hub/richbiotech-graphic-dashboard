const assert=require('node:assert/strict');
const fs=require('node:fs');
const index=fs.readFileSync('index.html','utf8');
const experience=fs.readFileSync('snippets/order-revision-experience-v1.js','utf8');
const workflow=fs.readFileSync('snippets/order-audit-version-workflow-v1.js','utf8');
const css=fs.readFileSync('snippets/order-revision-experience-v1.css','utf8');
const workflowCss=fs.readFileSync('snippets/order-audit-version-workflow-v1.css','utf8');

assert.ok(index.includes('snippets/order-revision-experience-v1.js?v=fix342'),'the live page must load the revision experience runtime');
assert.ok(index.includes('snippets/order-revision-experience-v1.css?v=fix342'),'the live page must load the revision experience styles');
assert.ok(index.includes("if(cst==='revision'&&versionEvidence&&versionSubmit){versionSubmit.click();return;}"),'the image-tab action must submit per-version correction evidence');
assert.ok(index.includes("(_omInfoAction||saveOM2)();"),'the image-tab action must retain the normal link-based worker transition');
assert.ok(index.includes('window.rbOpenOrderDestination=function(id,tabKey,version)'),'notifications must be able to open an exact order tab and version');
assert.ok(experience.includes("document.getElementById('rb-notif-list')||document.getElementById('rb-notif-body')"),'notification rendering must use the actual live list container');
assert.ok(experience.includes("tab:order.status==='revision'?'imgs':'info'"),'revision notifications must route to the image submission tab');
assert.ok(experience.includes("item&&item.result==='issue'&&!item.employeeSubmittedAt"),'notifications must identify unresolved revision versions');
assert.ok(experience.includes('window.rbOpenEvidenceLightbox=function(items,index,context)'),'evidence images must open in the shared large preview');
assert.ok(experience.includes("event.key==='ArrowLeft'")&&experience.includes("event.key==='ArrowRight'"),'the image preview must support keyboard navigation');
assert.ok(workflow.includes("current==='graphic'||current==='spec'"),'Graphic and Specialist employees must be able to attach correction evidence');
assert.ok(workflow.includes("window.rbOpenEvidenceLightbox(images,index,context||{})"),'Audit and employee evidence thumbnails must use the shared preview');
assert.ok(workflow.includes("proof.className='rb-av-fix-proof'"),'uploaded employee corrections must render back inside the matching version');
assert.ok(css.includes('#rb-evidence-lightbox .rb-el-dialog'),'the large evidence preview must have a responsive dialog layout');
assert.ok(workflowCss.includes('.rb-notification-target'),'the exact version opened from a notification must be visibly highlighted');

console.log('order-revision-experience-v1: all tests passed');
