(function(root){
'use strict';
if(root._rbSpecialworkPersistenceV2Loaded)return;
root._rbSpecialworkPersistenceV2Loaded=true;

var VERSION='2.1.0';
var LEGACY_PATH='/specialwork';
var ITEM_PATH='/specialwork_v2/items';
var DELETED_PATH='/specialwork_v2/deleted';
var LOCAL_KEY='rb_specialwork_v1';
var PENDING_KEY='rb_specialwork_pending_v2';
var originalSet=root.fbSet;
var originalGet=root.fbGet;
var lastRows=readLocal();
var memoryPending={},flushing=false,retryTimer=null;

function clone(value){try{return JSON.parse(JSON.stringify(value));}catch(error){return value;}}
function safeKey(value){return String(value||'').replace(/[.#$\[\]\/]/g,'_');}
function normalizePath(path){path=String(path||'').replace(/\/+$/,'');return path||'/';}
function rows(value){
  var out=[];
  if(Array.isArray(value))out=value;
  else if(value&&typeof value==='object')Object.keys(value).forEach(function(key){var row=value[key];if(row&&typeof row==='object'){row=clone(row);if(!row.id)row.id=key;out.push(row);}});
  return out.filter(function(row){return row&&row.id;}).map(clone);
}
function map(value){var out={};rows(value).forEach(function(row){out[String(row.id)]=row;});return out;}
function same(a,b){try{return JSON.stringify(a)===JSON.stringify(b);}catch(error){return false;}}
function readLocal(){try{return rows(JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]'));}catch(error){return[];}}
function writeLocal(value){var json=JSON.stringify(rows(value));try{localStorage.setItem(LOCAL_KEY,json);return true;}catch(error){try{if(root.rbStorageResilience)root.rbStorageResilience.relieve();}catch(ignore){}try{localStorage.setItem(LOCAL_KEY,json);return true;}catch(retry){return false;}}}
function set(path,value){if(typeof originalSet!=='function')return Promise.resolve(false);try{return Promise.resolve(originalSet(path,value));}catch(error){return Promise.resolve(false);}}
function get(path,callback){if(typeof originalGet!=='function'){callback(new Error('ไม่พบระบบอ่านข้อมูล'),null);return;}try{originalGet(path,callback);}catch(error){callback(error,null);}}
function readPending(){var stored={};try{stored=JSON.parse(localStorage.getItem(PENDING_KEY)||'{}')||{};}catch(error){}var out={};Object.keys(stored).forEach(function(path){out[path]=stored[path];});Object.keys(memoryPending).forEach(function(path){out[path]=memoryPending[path];});return out;}
function savePending(value){memoryPending=clone(value)||{};try{localStorage.setItem(PENDING_KEY,JSON.stringify(memoryPending));memoryPending={};return true;}catch(error){try{if(root.rbStorageResilience)root.rbStorageResilience.relieve();}catch(ignore){}try{localStorage.setItem(PENDING_KEY,JSON.stringify(memoryPending));memoryPending={};return true;}catch(retry){return false;}}}
function scheduleRetry(){clearTimeout(retryTimer);retryTimer=setTimeout(flushPending,5000);}
function flushPending(){if(flushing)return Promise.resolve(false);var pending=readPending(),paths=Object.keys(pending);if(!paths.length)return Promise.resolve(true);if(typeof originalSet!=='function'){scheduleRetry();return Promise.resolve(false);}flushing=true;return Promise.all(paths.map(function(path){return set(path,pending[path]);})).then(function(results){flushing=false;var ok=results.every(function(value){return value!==false;});if(ok){var latest=readPending();paths.forEach(function(path){if(same(latest[path],pending[path]))delete latest[path];});savePending(latest);if(Object.keys(readPending()).length)flushPending();}else scheduleRetry();return ok;},function(){flushing=false;scheduleRetry();return false;});}
function pendingFor(id){var key=safeKey(id);return Object.keys(readPending()).some(function(path){return path.indexOf('/'+key)>=0;});}

function merge(legacyValue,itemValue,deletedValue){
  var merged=map(legacyValue),current=map(itemValue),deleted=deletedValue&&typeof deletedValue==='object'?deletedValue:{};
  Object.keys(current).forEach(function(id){merged[id]=current[id];});
  Object.keys(deleted).forEach(function(id){if(deleted[id])delete merged[id];});
  return Object.keys(merged).map(function(id){return merged[id];}).sort(function(a,b){return Number(a.createdAt||0)-Number(b.createdAt||0);});
}
function applyPending(value,pending){var current=map(value),prefix=ITEM_PATH+'/';Object.keys(pending||{}).forEach(function(path){if(path.indexOf(prefix)!==0)return;var id=path.slice(prefix.length),next=pending[path];if(next==null)delete current[id];else current[id]=clone(next);});return Object.keys(current).map(function(id){return current[id];}).sort(function(a,b){return Number(a.createdAt||0)-Number(b.createdAt||0);});}

function writeRows(nextRows){
  nextRows=rows(nextRows);
  var before=map(lastRows),after=map(nextRows),pending=readPending();
  writeLocal(nextRows);
  Object.keys(after).forEach(function(id){
    if(!same(before[id],after[id])){
      pending[ITEM_PATH+'/'+safeKey(id)]=after[id];
      pending[DELETED_PATH+'/'+safeKey(id)]=null;
    }
  });
  Object.keys(before).forEach(function(id){
    if(!after[id]){
      pending[ITEM_PATH+'/'+safeKey(id)]=null;
      pending[DELETED_PATH+'/'+safeKey(id)]={at:Date.now(),by:root._rbUser&&root._rbUser.name||''};
    }
  });
  lastRows=nextRows.map(clone);
  savePending(pending);
  return flushPending();
}

function readRows(callback){
  var pending=3,result={legacy:null,items:null,deleted:null},errors=[];
  function done(){
    pending--;
    if(pending)return;
    if(errors.length===3){callback(errors[0],lastRows.map(clone));return;}
    var base=result.legacy==null?lastRows:result.legacy;
    var merged=applyPending(merge(base,result.items,result.deleted),readPending());
    lastRows=merged.map(clone);writeLocal(merged);
    callback(null,merged);
  }
  get(LEGACY_PATH,function(error,value){if(error)errors.push(error);else result.legacy=value;done();});
  get(ITEM_PATH,function(error,value){if(error)errors.push(error);else result.items=value;done();});
  get(DELETED_PATH,function(error,value){if(error)errors.push(error);else result.deleted=value;done();});
}

root.fbSet=function specialworkPerItemSet(path,value){
  if(normalizePath(path)!==LEGACY_PATH)return typeof originalSet==='function'?originalSet(path,value):Promise.resolve(false);
  return writeRows(value);
};
root.fbGet=function specialworkMergedGet(path,callback){
  if(normalizePath(path)!==LEGACY_PATH){if(typeof originalGet==='function')return originalGet(path,callback);callback(new Error('ไม่พบระบบอ่านข้อมูล'),null);return;}
  readRows(callback);
};

root.addEventListener&&root.addEventListener('online',flushPending);
if(root.setInterval)root.setInterval(function(){if(Object.keys(readPending()).length)flushPending();},30000);
root.rbSpecialworkPersistence={version:VERSION,writeRows:writeRows,readRows:readRows,merge:merge,flush:flushPending,pendingFor:pendingFor,pending:function(){return Object.keys(readPending()).length>0;},lastRows:function(){return lastRows.map(clone);}};
if(root.document&&root.document.documentElement)root.document.documentElement.setAttribute('data-specialwork-persistence',VERSION);
})(window);
