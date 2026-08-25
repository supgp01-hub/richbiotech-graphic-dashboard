const assert=require('assert');
const fs=require('fs');

const index=fs.readFileSync('index.html','utf8');

assert.ok(index.includes("b.getAttribute('data-link-btn')||b.classList.contains('rb-revision-edit-toggle')"),'read-only setup must keep the manager edit control enabled');
assert.ok(index.includes('window._rbEnableOrderManagerEdit(section)'),'entering manager edit mode must re-enable original form fields');
const auditSync=fs.readFileSync('snippets/order-audit-persistence-v1.js','utf8');
const detailCss=fs.readFileSync('snippets/order-detail-unified-v1.css','utf8');
assert.ok(auditSync.includes("section.querySelectorAll('input,select,textarea,button')"),'manager edit helper must unlock the original controls');
assert.ok(detailCss.includes('#rb-order-modal[data-order-mode="edit"] #om-add-clip-wrap{display:none!important}'),'existing order detail must hide the obsolete standalone ad-link button');
assert.ok(index.includes("_syncClipToVer"),'hiding the duplicate control must not remove stored ad-link synchronization');
assert.ok(index.includes('<meta name="rb-build" content="fix281-order-detail-edit">'),'the page must expose the regression-fix build');

console.log('order-detail-edit-controls-v1: all tests passed');
