const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const path=require('path');

class StorageMock{
  constructor(limit){this.limit=limit;this.values={};}
  getItem(key){return Object.prototype.hasOwnProperty.call(this.values,key)?this.values[key]:null;}
  removeItem(key){delete this.values[key];}
  setItem(key,value){value=String(value);const size=Object.entries(Object.assign({},this.values,{[key]:value})).reduce((n,p)=>n+p[0].length+p[1].length,0);if(size>this.limit){const e=new Error('Setting the value exceeded the quota');e.name='QuotaExceededError';e.code=22;throw e;}this.values[key]=value;}
}

const localStorage=new StorageMock(850);
const document={readyState:'loading',addEventListener(){},documentElement:{},getElementById(){return null;},querySelector(){return null;},querySelectorAll(){return[];},body:{appendChild(){}}};
function MutationObserver(){this.observe=function(){};}
const window={localStorage,document,MutationObserver,Storage:StorageMock,requestAnimationFrame(fn){fn();},setTimeout(){},rbStorageResilience:{isQuotaError:e=>e&&e.name==='QuotaExceededError',relieve(){}}};
window.window=window;
const context={window,document,MutationObserver,Storage:StorageMock,requestAnimationFrame:window.requestAnimationFrame,setTimeout:window.setTimeout,console};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','snippets','idcard-save-reliability-v1.js'),'utf8'),context);

const rows=[{id:'ic_1',employee:'Nune',photo:{name:'card.jpg',size:500000,data:'data:image/jpeg;base64,'+'x'.repeat(2400)}}];
localStorage.setItem('rb_idcards_v1',JSON.stringify(rows));
assert.strictEqual(JSON.parse(localStorage.getItem('rb_idcards_v1'))[0].photo.data.length>2000,true,'full image must remain readable from memory');
assert.strictEqual(JSON.parse(localStorage.values.rb_idcards_v1)[0].photo.data,undefined,'quota fallback must keep only compact photo metadata on disk');
assert.strictEqual(window.__rbIdcardCacheCompacted,true,'quota fallback state must be exposed');
assert(window.rbIdcardReliability,'reliability API must be installed');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const runtime=fs.readFileSync(path.join(__dirname,'..','snippets','idcard-save-reliability-v1.js'),'utf8');
assert(runtime.includes('root.__rbIdcardLastSync=null'),'each bulk save must clear the previous cloud result before starting');
assert(runtime.includes("SHARED_PATH='/workflow_snapshots/idcards_shared_v1'"),'ID cards must use the existing active-user shared Firebase area');
assert(runtime.includes("LEGACY_PATH='/idcards'"),'the legacy ID-card collection must remain available as a migration source');
assert(runtime.includes('originalSet(SHARED_PATH,legacyRows)'),'legacy ID-card records must be copied without deleting the source');
assert(runtime.includes("['_icInit','_icEditField'"),'all team roles must receive the ID-card editor controls');
assert(html.includes('snippets/idcard-save-reliability-v1.js?v=fix277'),'reliability runtime must be loaded');
assert(html.includes('snippets/idcard-save-reliability-v1.css?v=fix276'),'reliability styles must be loaded');
console.log('idcard-save-reliability-v1 tests passed');
