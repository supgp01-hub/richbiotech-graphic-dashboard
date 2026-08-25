const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const shared=fs.readFileSync(path.join(root,'snippets','page-size-pagination-v1.js'),'utf8');
const styles=fs.readFileSync(path.join(root,'snippets','page-size-pagination-v1.css'),'utf8');
const links=fs.readFileSync(path.join(root,'snippets','performance-v4.js'),'utf8');
const listFacebook=fs.readFileSync(path.join(root,'snippets','list-facebook-followup.js'),'utf8');

assert.ok(index.includes('page-size-pagination-v1.js?v=277b'),'shared pagination runtime must load');
assert.ok(index.includes('page-size-pagination-v1.css?v=277b'),'shared pagination styles must load');
assert.ok(shared.includes("order:{panel:'[data-sub=\"order\"]'"),'orders must use shared pagination');
assert.ok(shared.includes("commission:{panel:'[data-sub=\"commission\"]'"),'commission must use shared pagination');
assert.ok(shared.includes("audit:{panel:'[data-sub=\"audit\"]'"),'audit deductions must use shared pagination');
assert.ok(shared.includes("idcard:{panel:'[data-sub=\"idcard\"]'"),'ID cards must use shared pagination');
assert.ok(index.includes("rbPageSizeMarkup('fblist'"),'Facebook Pages must render the shared selector');
assert.ok(index.includes("rbPageSizeSet('fblist'"),'Facebook Pages must remember its page size');
assert.ok(listFacebook.includes("rbPageSizeMarkup('listfb'"),'List Facebook must render the shared selector');
assert.ok(listFacebook.includes("saveListPageSize(event.target.value)"),'List Facebook selector must be interactive');
assert.ok(links.includes("rbPageSizeSet('links'"),'Content Tracker must remember its own page size');
assert.match(shared,/ALLOWED=\[50,100,200\]/,'only approved page sizes are offered');
assert.ok(styles.includes('@media(max-width:680px)'),'pagination must adapt to mobile');
console.log('page-size-pagination-v1 tests passed (7 pages covered)');
