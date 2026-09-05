const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const multitab = fs.readFileSync('snippets/multitab-stability-v1.js', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');
const listEditor = fs.readFileSync('snippets/list-facebook-editor.js', 'utf8');
const tracker = fs.readFileSync('snippets/performance-v4.js', 'utf8');
const bulk = fs.readFileSync('snippets/bulk-import-v2.js', 'utf8');

const shared = new Map();
const localStorage = {
  getItem: key => shared.has(key) ? shared.get(key) : null,
  setItem: (key, value) => shared.set(key, String(value)),
  removeItem: key => shared.delete(key)
};

function makeTab(){
  const listeners = {};
  const context = {
    Date, Math, JSON, localStorage,
    document: {hidden:false, addEventListener:(n,fn)=>{listeners['d:'+n]=fn;}},
    CustomEvent: function(type, init){this.type=type;this.detail=init&&init.detail;},
    setInterval: fn => {context._beat=fn;return 1;}, clearInterval:()=>{},
    setTimeout, clearTimeout,
    window: null
  };
  context.window = context;
  context.addEventListener = (n,fn)=>{listeners['w:'+n]=fn;};
  context.dispatchEvent = ev => {const fn=listeners['w:'+ev.type];if(fn)fn(ev);};
  vm.runInNewContext(multitab, context);
  return context;
}

async function wait(ms){return new Promise(resolve=>setTimeout(resolve,ms));}

(async()=>{
const first = makeTab();
const second = makeTab();
await wait(500);
assert.equal(Number(first.rbMultiTab.isLeader())+Number(second.rbMultiTab.isLeader()),1,'exactly one visible tab should own realtime sync');
const currentLeader=first.rbMultiTab.isLeader()?first:second;
const follower=currentLeader===first?second:first;
currentLeader.rbMultiTab.release();
follower.rbMultiTab.claim();
await wait(500);
assert.equal(follower.rbMultiTab.isLeader(), true, 'a follower must take over after the leader closes');

assert.ok(index.indexOf('multitab-stability-v1.js?v=205') < index.indexOf('list-facebook-editor.css'), 'leader election must load before feature scripts');
assert.ok(index.includes("function fbIsLeader(){return !window.rbMultiTab||window.rbMultiTab.isLeader();}"), 'Firebase realtime must use one leader tab');
assert.ok(index.includes("if(!fbIsLeader()&&!force){fbSetSyncState('online','พร้อมใช้งาน','ซิงก์ผ่านแท็บหลัก');return;}"), 'follower tabs must not flush the shared order queue in the background');
assert.ok(index.includes("if(!isLeader)fbSetSyncState('connecting','กำลังอัปเดต...'"), 'every follower tab must hydrate its own order cache from Firebase');
assert.equal(index.includes("if(!fbIsLeader()){fbSetSyncState('online','พร้อมใช้งาน','ซิงก์ผ่านแท็บหลัก');refreshOrderViews();if(cb)cb();return;}"),false,'a follower tab must never skip its initial order snapshot');
assert.ok(index.includes("if(!fbIsLeader()){fbRefreshOrders();return;}"), 'a follower returning online or visible must fetch a fresh snapshot without starting realtime twice');
assert.ok(index.includes('var q=false,pending=[];function schedule(ms)'), 'icon observer must process only added nodes');
assert.equal(index.includes('new MutationObserver(schedule).observe(document.documentElement'), true, 'targeted icon observer must remain active for dynamic UI');
assert.equal(index.includes('setTimeout(function(){window._lfbFetch&&window._lfbFetch();},0)'), false, 'hidden Facebook Pages table must not render at startup');
assert.ok(index.includes('SSTTL=12*60*60*1000'), 'login should persist across tabs for one work shift');
assert.ok(index.includes('localStorage.getItem(SS)||sessionStorage.getItem(SS)'), 'all tabs should share the active login session');
assert.ok(index.includes('if(e.key!==SS)return;var cross=getS()'), 'login and logout changes must propagate to open tabs');
assert.ok(listEditor.includes('pageSize:50'), 'List Facebook should render at most 50 rows per page');
assert.ok(tracker.includes("rbPageSizeGet?window.rbPageSizeGet('links')"), 'Content Tracker should restore its remembered page size');
assert.ok(tracker.includes("[50,100,200].indexOf(n)>=0"), 'Content Tracker must restrict page sizes to approved values');
assert.ok(tracker.includes("window.rbMultiTab&&!window.rbMultiTab.isLeader()"), 'Content Tracker writes must be serialized by the leader tab');
assert.ok(bulk.includes("window.rbMultiTab&&!window.rbMultiTab.isLeader()"), 'Content Tracker realtime must run only in the leader tab');
assert.ok(bulk.includes("function cloudInit(){if(!cloudAllowed()||cloudStarted)return"), 'every visible tab must perform a one-time authenticated tracker read even when it is not the realtime leader');

console.log('multitab-stability-v1: all tests passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
