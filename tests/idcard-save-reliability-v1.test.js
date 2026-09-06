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

const rows=[{id:'ic_1',employee:'Nune',updatedAt:2,photo:{name:'card.jpg',size:500000,data:'data:image/jpeg;base64,'+'x'.repeat(2400)}}];
localStorage.setItem('rb_idcards_v1',JSON.stringify(rows));
assert.strictEqual(JSON.parse(localStorage.getItem('rb_idcards_v1'))[0].photo.data.length>2000,true,'full image must remain readable from memory');
assert.strictEqual(JSON.parse(localStorage.values.rb_idcards_v1)[0].photo.data,undefined,'quota fallback must keep only compact photo metadata on disk');
assert.strictEqual(window.__rbIdcardCacheCompacted,true,'quota fallback state must be exposed');
assert(window.rbIdcardReliability,'reliability API must be installed');
assert.notStrictEqual(
  window.rbIdcardReliability.rowFingerprint({id:'ic_same',status:'pending',updatedAt:123}),
  window.rbIdcardReliability.rowFingerprint({id:'ic_same',status:'passed',updatedAt:123}),
  'records changed within the same millisecond must still be detected'
);
const merged=window.rbIdcardReliability.mergeChangedLocal([{id:'ic_1',employee:'Old cloud value',updatedAt:1}],0);
assert.strictEqual(merged.find(row=>row.id==='ic_1').employee,'Nune','a late cloud read must not overwrite a newer local edit');
const sorted=window.rbIdcardReliability.sortRecordsByStatus([
  {id:'failed',status:'missing'},
  {id:'passed',status:'has'},
  {id:'waiting',status:''},
  {id:'vacant',status:'vacant'},
  {id:'expired',status:'expired'}
]);
assert.deepStrictEqual(Array.from(sorted,row=>row.id),['vacant','waiting','passed','failed','expired'],'ID-card rows must follow the approved status order');
assert.strictEqual(window.rbIdcardReliability.matchesFilters('บอล','has','บอล','has'),true,'employee and status filters must work together');
assert.strictEqual(window.rbIdcardReliability.matchesFilters('บอล','missing','บอล','has'),false,'a mismatched status must be excluded');
assert.strictEqual(window.rbIdcardReliability.matchesFilters('แจ๋ม','has','บอล','all'),false,'a mismatched employee must be excluded');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const runtime=fs.readFileSync(path.join(__dirname,'..','snippets','idcard-save-reliability-v1.js'),'utf8');
assert(runtime.includes('root.__rbIdcardLastSync=null'),'each bulk save must clear the previous cloud result before starting');
assert(runtime.includes("SHARED_PATH='/workflow_snapshots/idcards_shared_v1'"),'ID cards must use the existing active-user shared Firebase area');
assert(runtime.includes("LEGACY_PATH='/idcards'"),'the legacy ID-card collection must remain available as a migration source');
assert(runtime.includes('root.fbSet(LEGACY_PATH,mergedRows)'),'legacy ID-card records must be copied without deleting the source');
assert(runtime.includes("root._rbUser&&root._rbUser.role==='sup'"),'only Supervisor may read and migrate the restricted legacy collection');
assert(runtime.includes('(sharedRows||[]).concat(legacyRows||[])'),'Supervisor migration must merge shared and legacy rows without dropping either source');
assert(runtime.includes("SHARED_PATH+'/'+id"),'ID cards must be written per employee instead of one large photo payload');
assert(runtime.includes('writes.reduce'),'per-employee writes must be sequenced to prevent request bursts and timeouts');
assert(runtime.includes('next[id]=rowFingerprint(row)'),'change detection must compare complete record content, not timestamps alone');
assert(runtime.includes('mergeChangedLocal(sharedRows||[],readVersion)'),'a slow shared read must preserve edits made while it was loading');
assert(runtime.includes("var STATUS_ORDER={vacant:0,'':1,has:2,missing:3,expired:4}"),'status priority must keep vacant rows first and failed rows after passed rows');
assert(runtime.includes("root.rbPageSizePagination.apply('idcard')"),'pagination must refresh after rows are reordered');
assert(runtime.includes("matches('[data-sub=\"idcard\"],#ic-tbody tr')"),'newly rendered ID-card rows must trigger automatic sorting');
assert(runtime.includes("panel.id='ic-list-filters'"),'the ID-card table must expose employee and status filters');
assert(runtime.includes("row.setAttribute('data-rbps-ignore','filter')"),'filtered rows must be excluded from pagination counts');
assert(runtime.includes("['_icInit','_icEditField'"),'all team roles must receive the ID-card editor controls');
assert(html.includes('snippets/idcard-save-reliability-v1.js?v=fix368'),'reliability runtime must be loaded');
assert(html.includes('snippets/idcard-save-reliability-v1.css?v=fix368'),'reliability styles must be loaded');
console.log('idcard-save-reliability-v1 tests passed');
