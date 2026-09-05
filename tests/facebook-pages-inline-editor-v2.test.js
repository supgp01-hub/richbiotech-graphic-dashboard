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
assert.equal(api.cloudKey('row/a.b'),'row_a_b','Firebase child keys must be safe');
context._rbUser={role:'graphic'};
assert.equal(api.canEdit(),true,'every active Graphic team role must be able to edit Facebook Pages');
context._rbUser={role:'ads'};
assert.equal(api.canEdit(),true,'Ads users must be able to edit Facebook Pages');
assert.equal(api.canRefresh(),false,'Ads users must not refresh the shared source');
context._rbUser={role:'audit'};
assert.equal(api.canRefresh(),true,'Audit users must refresh the shared source');
assert.ok(source.includes("CLOUD_PATH+'/'+cloudKey(key)"),'each edited page must save independently to prevent concurrent overwrite');
assert.ok(source.includes("CLOUD_PATH='/workflow_snapshots/fbpages_edits_shared_v1'"),'edits must use the existing active-user shared Firebase area');
assert.ok(source.includes("LEGACY_CLOUD_PATH='/fbpages_edits_v2'"),'the previous online edits must remain available for non-destructive migration');
assert.equal(source.includes("contentEditable='true'"),false,'the editor must not use unrestricted contentEditable cells');
assert.ok(source.includes("window._lfbFetch=refreshLiveData"),'opening or refreshing Facebook Pages must use the live sheet loader');
assert.ok(source.includes("fetch(SHEET_URL,{cache:'no-store'})"),'live status must bypass stale HTTP cache');
assert.ok(css.includes('thead th:nth-child(5):after'),'notification column must show a lock');
assert.ok(source.includes('professionalizeRoot(root)'),'the Facebook Pages renderer must install the professional layout');
assert.ok(source.includes('if(grids[1])grids[1].remove()'),'the marked workflow summary row must be removed');
assert.ok(source.includes("heads[3].textContent='พนักงาน'"),'the owner column must be labelled as employee');
assert.ok(source.includes('rb-fbp-employee'),'employee cells must render only the employee name');
assert.ok(css.includes('table-layout:fixed!important'),'the table must keep proportional column widths');
assert.ok(css.includes('.rb-fbp-filter-field>.rb-fbp-filter-label'),'filter labels must use a dedicated selector so the search icon wrapper is not styled as a label');
assert.ok(css.includes('.rb-fbp-search-field>.rb-icon-input-wrap.rb-search-wide'),'the wrapped search field must align with every dropdown');
assert.ok(css.includes('display:table-cell!important'),'the action column must retain table-cell layout so row divider lines align');
assert.ok(index.includes('facebook-pages-inline-editor-v2.js?v=fix318'));
assert.ok(index.includes('facebook-pages-inline-editor-v2.css?v=fix308'));
assert.ok(index.includes('<meta name="rb-build" content="fix354">'));

console.log('facebook-pages-inline-editor-v2: all tests passed');
