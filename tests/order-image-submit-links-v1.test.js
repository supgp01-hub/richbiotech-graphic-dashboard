const assert=require('assert');
const fs=require('fs');
const index=fs.readFileSync('index.html','utf8');
const auditSync=fs.readFileSync('snippets/order-audit-persistence-v1.js','utf8');

assert.ok(index.includes("submitWorkTab.textContent='🔗 ลิงก์ส่งงาน'"),'the existing work-link tab must remain available');
assert.ok(index.includes("submitImageTab.textContent='▧ ลิงก์ส่งงานภาพ'"),'the image-delivery tab must be visible');
assert.ok(index.includes("imageSubmitLinksAdd.textContent='+ เพิ่มลิงก์ส่งงานภาพ'"),'the image-delivery tab must add link rows');
assert.ok(index.includes("function imageSubmitLinkValues()"),'the save workflow must collect image-delivery rows');
assert.ok(index.includes('imageSubmitLinks:imageSubmitLinkValues(),'),'new and edited orders must save image-delivery links separately');
assert.ok(index.includes('order.imageSubmitLinks=currentImageSubmitLinks'),'normal workflow saves must persist image-delivery links');
assert.ok(index.includes('imageLinks:currentImageSubmitLinks.slice()'),'revision submissions must preserve image-delivery links in history');
assert.ok(index.includes('Array.isArray(_latestRevision.imageLinks)?_latestRevision.imageLinks.slice()'),'the latest image-delivery revision must reopen');
assert.ok(index.includes("revisionUniformLinkRows('ลิงก์ส่งงานภาพ',imageWorkLinks,true)"),'the job detail view must display image-delivery links');
assert.ok(auditSync.includes("box.setAttribute('aria-label','ลิงก์ส่งงานภาพ')"),'the image-work tab must have a dedicated synchronized link panel');
assert.ok(auditSync.includes("label.textContent='ภาพ '+(index+1)"),'image links must remain clearly numbered');
assert.ok(auditSync.includes("makeAction('คัดลอกลิงก์'"),'every synchronized image link must be copyable');
assert.ok(auditSync.includes("makeAction('เปิดลิงก์'"),'every synchronized image link must remain openable');
assert.ok(index.includes('(d.imageSubmitLinks||[]).some(Boolean)'),'draft recovery must retain image-delivery links');
assert.ok(index.includes('<meta name="rb-build" content="fix282-audit-version-workflow">'),'the deployed page must expose the image-delivery build');
assert.ok(index.includes('snippets/order-audit-persistence-v1.js?v=fix282'),'the image-delivery helper must use the current cache version');

console.log('order-image-submit-links-v1: all tests passed');
