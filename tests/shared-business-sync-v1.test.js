const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const source=fs.readFileSync('snippets/shared-business-sync-v1.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const writes=[];

class Storage{
  constructor(){this.values=new Map();}
  getItem(key){return this.values.has(key)?this.values.get(key):null;}
  setItem(key,value){this.values.set(key,String(value));}
  removeItem(key){this.values.delete(key);}
}
const localStorage=new Storage();
const document={hidden:false,documentElement:{setAttribute(name,value){this[name]=value;}},addEventListener(){},getElementById(){return null;}};
const window={
  localStorage,document,_rbUser:{name:'Tester'},
  fbSet(path,data){writes.push({path,data});return Promise.resolve(true);},
  fbGet(path,callback){callback(null,null);},
  addEventListener(){},dispatchEvent(){},
  rbPersistence:{flush(){}}
};
const context={window,document,localStorage,Storage,JSON,Object,Array,String,Number,Date,Math,Promise,console,setTimeout(){return 1;},clearTimeout(){}};
vm.createContext(context);
vm.runInContext(source,context);

localStorage.setItem('rb_brand_pages_v1',JSON.stringify({SO_PINK:[{name:'Page A',status:0}]}));
const brand=JSON.parse(localStorage.getItem('rb_brand_pages_v1'));
assert.ok(brand.SO_PINK[0]._syncId,'legacy rows must receive stable online ids');
assert.ok(writes.some(write=>write.path.startsWith('/brand_pages_v1/SO_PINK/')),'Facebook page records must write to an online child path');

localStorage.setItem('rb_channel_data_v1',JSON.stringify({TIKTOK:[{name:'TikTok A',status:'active'}]}));
assert.ok(writes.some(write=>write.path.startsWith('/channel_data_v1/TIKTOK/')),'channel records must write online');

localStorage.setItem('rb_fb_notif',JSON.stringify({'Page A':'2'}));
assert.ok(writes.some(write=>write.path.startsWith('/facebook_notifications/')),'notification changes must write online');

localStorage.setItem('rb_timeline_v1',JSON.stringify([{ts:100,sec:'งาน',act:'เพิ่ม'}]));
assert.ok(writes.some(write=>write.path==='/timeline_v1/100'),'audit timeline items must write online independently');

localStorage.setItem('rb_users',JSON.stringify([{name:'User A',role:'graphic'}]));
assert.ok(!writes.some(write=>write.path==='/rb_users'),'legacy local user data must never enter the denied shared-data queue');

localStorage.setItem('rb_order_draft_v1_Tester',JSON.stringify({name:'งานที่กำลังกรอก',deadline:'2026-09-04'}));
assert.ok(writes.some(write=>write.path==='/order_form_drafts/Tester'),'unfinished order form drafts must be recoverable online per user');

assert.deepEqual(
  JSON.parse(JSON.stringify(window.rbSharedBusinessSync.mapFromCloud({a:{key:'Page A',value:'1'}}))),
  {'Page A':'1'},
  'cloud map snapshots must restore device-local caches after refresh'
);
assert.deepEqual(
  JSON.parse(JSON.stringify(window.rbSharedBusinessSync.mergeMap({'Local only':'2'},{'Remote only':'1'}))),
  {'Remote only':'1','Local only':'2'},
  'first migration must preserve unsynced records from another user device'
);
assert.equal(document.documentElement['data-shared-business-sync'],'1.1.0');
assert.ok(index.includes('snippets/shared-business-sync-v1.js?v=fix338'),'the online business sync layer must be loaded by the live page');
console.log('shared-business-sync-v1: all tests passed');
