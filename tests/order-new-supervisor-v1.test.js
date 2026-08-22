const fs=require('fs');const assert=require('assert');
const index=fs.readFileSync('index.html','utf8');
assert.ok(index.includes("var _isView=!!id&&window._ordViewMode==='team'"),'team view mode must only lock an existing order, never a new order');
assert.ok(index.includes("_omSaveBtn.textContent='💾 สั่งงาน'"),'editable Supervisor forms must expose the order action');
assert.ok(index.includes("_omSaveBtn.onclick=saveOM2"),'the order action must save through the normal order workflow');
assert.ok(index.includes("ab.id='ord-add-btn'")&&index.includes('window.openOM(null)'),'Add new order must open a genuinely new order');
assert.ok(index.includes('<meta name="rb-build" content="fix232">'));
console.log('order-new-supervisor-v1: all tests passed');
