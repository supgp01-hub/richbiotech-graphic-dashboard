const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const source=fs.readFileSync('snippets/facebook-pages-inline-editor-v2.js','utf8');
const css=fs.readFileSync('snippets/facebook-pages-inline-editor-v2.css','utf8');
const index=fs.readFileSync('index.html','utf8');
const store={};
const context={
  window:null,
  localStorage:{getItem(key){return store[key]||null;},setItem(key,value){store[key]=String(value);}},
  document:{addEventListener(){},querySelector(){return null;},getElementById(){return null;}},
  setTimeout(){},
  MutationObserver:function(){this.observe=function(){};},
  fetch(){return Promise.reject(new Error('not used'));}
};
context.window=context;
vm.runInNewContext(source,context);
const api=context._fbpInlineEditorTest;

assert.ok(api,'test API must be available');
const csv=['ชื่อเพจ,สินค้า,สถานะ,เจ้าของ,Facebook ID','เพจ 160,ขุนแผน,ใช้งาน,TER,160','"เพจ, สำรอง",เฮฟเว่นพลัส,ว่าง,JAM,161'].join('\n');
const rows=api.parseSheet(csv);
assert.equal(rows.length,2);
assert.equal(rows[1].name,'เพจ, สำรอง','quoted commas must remain in the page name');
assert.equal(rows[0].st,'ใช้งาน','the real source status must be preserved');
assert.deepEqual(Array.from(api.unique(['ขุนแผน','ขุนแผน','เฮฟเว่นพลัส'])),['ขุนแผน','เฮฟเว่นพลัส']);
assert.equal(api.rowKey(rows[0]),api.rowKey({...rows[0],name:'ชื่อใหม่'}),'Facebook ID must keep edit identity stable after renaming');
assert.equal(api.mergeMaps({a:{st:'ว่าง',updatedAt:200}},{a:{st:'ใช้งาน',updatedAt:100}}).a.st,'ว่าง','newer edits must win');
assert.ok(api.notificationMarkup('เพจ 160').includes('🔒'),'notification status must be rendered as locked');
assert.equal(source.includes("contentEditable='true'"),false,'the editor must not use unrestricted contentEditable cells');
assert.ok(source.includes("window._lfbFetch=refreshLiveData"),'opening or refreshing Facebook Pages must use the live sheet loader');
assert.ok(source.includes("fetch(SHEET_URL,{cache:'no-store'})"),'live status must bypass stale HTTP cache');
assert.ok(css.includes('thead th:nth-child(5):after'),'notification column must show a lock');
assert.ok(index.includes('facebook-pages-inline-editor-v2.js?v=fix299'));
assert.ok(index.includes('facebook-pages-inline-editor-v2.css?v=fix299'));
assert.ok(index.includes('<meta name="rb-build" content="fix300-leave-persistence">'));

console.log('facebook-pages-inline-editor-v2: all tests passed');
