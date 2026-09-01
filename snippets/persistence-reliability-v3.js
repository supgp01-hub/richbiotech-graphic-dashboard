(function(root){
'use strict';
if(root._rbPersistenceReliabilityV3Loaded)return;
root._rbPersistenceReliabilityV3Loaded=true;

var VERSION='3.1.0';
var QUEUE_KEY='rb_generic_write_queue_v3';
var RETRY_MS=5000;
var originalSet=root.fbSet;
var originalGet=root.fbGet;
var memoryQueue=[];
var active={};
var activePaths={};
var retryTimer=null;

function clone(value){try{return JSON.parse(JSON.stringify(value));}catch(error){return value;}}
function pathOf(path){var value=String(path||'/').replace(/\/+$/,'');if(!value)value='/';return value.charAt(0)==='/'?value:'/'+value;}
function readQueue(){
  if(memoryQueue.length)return memoryQueue.slice();
  try{var value=JSON.parse(localStorage.getItem(QUEUE_KEY)||'[]');return Array.isArray(value)?value:[];}catch(error){return[];}
}
function writeQueue(queue){
  queue=Array.isArray(queue)?queue:[];
  try{localStorage.setItem(QUEUE_KEY,JSON.stringify(queue));memoryQueue=[];return true;}
  catch(error){
    if(root.rbStorageResilience&&typeof root.rbStorageResilience.relieve==='function')root.rbStorageResilience.relieve();
    try{localStorage.setItem(QUEUE_KEY,JSON.stringify(queue));memoryQueue=[];return true;}
    catch(retryError){memoryQueue=queue.slice();return false;}
  }
}
function plannerDraftEntries(value,entry){
  var rows=[];
  if(Array.isArray(value))rows=value;
  else if(value&&typeof value==='object')Object.keys(value).forEach(function(key){var row=value[key];if(row&&typeof row==='object'){if(!row.id)row=Object.assign({id:key},row);rows.push(row);}});
  return rows.filter(function(row){return row&&row.id;}).map(function(row,index){
    var key=String(row.id).replace(/[^a-zA-Z0-9_-]/g,'_');
    return{token:(entry&&entry.token||'sync')+'_draft_'+index,path:'/order_planner/drafts/'+key,data:clone(row),ts:Number(entry&&entry.ts||Date.now())+index};
  });
}
function migrateUnsafeCollectionWrites(){
  var queue=readQueue(),next=[],changed=false;
  queue.forEach(function(entry){
    if(!entry||pathOf(entry.path)!=='/order_planner/drafts'){next.push(entry);return;}
    changed=true;
    plannerDraftEntries(entry.data,entry).forEach(function(child){
      for(var i=next.length-1;i>=0;i--)if(pathOf(next[i]&&next[i].path)===pathOf(child.path))next.splice(i,1);
      next.push(child);
    });
  });
  if(changed)writeQueue(next);
  return changed;
}
function queueWrite(path,data){
  path=pathOf(path);
  var queue=readQueue(),next=[],entry={token:'sync_'+Date.now()+'_'+Math.random().toString(36).slice(2,8),path:path,data:clone(data),ts:Date.now()};
  queue.forEach(function(item){if(item&&pathOf(item.path)!==path)next.push(item);});
  next.push(entry);writeQueue(next);dispatchState();return entry;
}
function removeWrite(token){writeQueue(readQueue().filter(function(item){return item&&item.token!==token;}));dispatchState();}
function pendingCount(){return readQueue().length;}
function relatedPending(path){var request=pathOf(path);return readQueue().some(function(item){if(!item)return false;var opPath=pathOf(item.path);return opPath===request||opPath.indexOf(request==='/'?'/':request+'/')===0||request.indexOf(opPath==='/'?'/':opPath+'/')===0;});}
function split(path){return pathOf(path).split('/').filter(Boolean);}
function readNested(value,parts){for(var i=0;i<parts.length;i++){if(value==null||typeof value!=='object'||!Object.prototype.hasOwnProperty.call(value,parts[i]))return undefined;value=value[parts[i]];}return value;}
function writeNested(value,parts,nextValue){
  if(!parts.length)return clone(nextValue);
  if(!value||typeof value!=='object'||Array.isArray(value))value={};else value=clone(value);
  var cursor=value;
  for(var i=0;i<parts.length-1;i++){var key=parts[i];if(!cursor[key]||typeof cursor[key]!=='object'||Array.isArray(cursor[key]))cursor[key]={};cursor=cursor[key];}
  var last=parts[parts.length-1];if(nextValue===null||typeof nextValue==='undefined')delete cursor[last];else cursor[last]=clone(nextValue);
  return value;
}
function overlay(path,data){
  var request=pathOf(path),requestParts=split(request),value=clone(data);
  readQueue().sort(function(a,b){return Number(a.ts||0)-Number(b.ts||0);}).forEach(function(item){
    if(!item)return;
    var opPath=pathOf(item.path),opParts=split(opPath);
    if(opPath===request){value=clone(item.data);return;}
    if(opPath.indexOf(request==='/'?'/':request+'/')===0){value=writeNested(value,opParts.slice(requestParts.length),item.data);return;}
    if(request.indexOf(opPath==='/'?'/':opPath+'/')===0){var nested=readNested(item.data,requestParts.slice(opParts.length));if(typeof nested!=='undefined')value=clone(nested);}
  });
  return value;
}
function setChip(state,text,title){
  var chip=document.getElementById('rb-sync-chip');
  if(typeof root.fbSetSyncState==='function'){root.fbSetSyncState(state,text,title);return;}
  if(!chip)return;
  chip.setAttribute('data-state',state);chip.title=title||text;
  var label=chip.querySelector('span:last-child');if(label)label.textContent=text;
}
function dispatchState(){
  var count=pendingCount();
  try{root.dispatchEvent(new CustomEvent('rb:persistence-state',{detail:{pending:count,version:VERSION}}));}catch(error){}
  if(count)setChip(typeof navigator!=='undefined'&&navigator.onLine===false?'waiting':'saving',typeof navigator!=='undefined'&&navigator.onLine===false?'รออินเทอร์เน็ต':'รอซิงก์ '+count+' รายการ','ข้อมูลในเครื่องปลอดภัยและจะซิงก์อัตโนมัติ');
}
function schedule(){clearTimeout(retryTimer);retryTimer=setTimeout(flush,RETRY_MS);}
function attempt(entry,initial){
  if(!entry||active[entry.token]||activePaths[pathOf(entry.path)])return Promise.resolve(false);
  if(typeof navigator!=='undefined'&&navigator.onLine===false){dispatchState();schedule();return Promise.resolve(false);}
  if(typeof originalSet!=='function'){dispatchState();schedule();return Promise.resolve(false);}
  active[entry.token]=true;activePaths[pathOf(entry.path)]=entry.token;
  return Promise.resolve().then(function(){return originalSet(entry.path,clone(entry.data));}).then(function(ok){
    delete active[entry.token];delete activePaths[pathOf(entry.path)];
    if(ok===false){dispatchState();schedule();return false;}
    removeWrite(entry.token);
    if(pendingCount())setTimeout(flush,0);
    return true;
  },function(){delete active[entry.token];delete activePaths[pathOf(entry.path)];dispatchState();schedule();return false;});
}
function flush(){
  clearTimeout(retryTimer);
  if(typeof navigator!=='undefined'&&navigator.onLine===false){dispatchState();return;}
  var queue=readQueue(),entry=null;
  for(var i=0;i<queue.length;i++){if(queue[i]&&!active[queue[i].token]&&!activePaths[pathOf(queue[i].path)]){entry=queue[i];break;}}
  if(!entry){dispatchState();return;}
  attempt(entry,false).then(function(ok){if(ok&&pendingCount())flush();});
}

root.fbSet=function reliableFbSet(path,data){var entry=queueWrite(path,data);if(activePaths[entry.path]){schedule();return Promise.resolve(false);}return attempt(entry,true);};
root.fbGet=function reliableFbGet(path,callback){
  if(typeof originalGet!=='function'){callback(new Error('ไม่พบระบบอ่านข้อมูล'),overlay(path,null));return;}
  originalGet(path,function(error,data){
    var pending=relatedPending(path);
    callback(error&&pending?null:error,overlay(path,data));
  });
};
root.rbPersistence={version:VERSION,pendingCount:pendingCount,flush:flush,overlay:overlay,queue:readQueue,related:relatedPending,migrateUnsafeCollectionWrites:migrateUnsafeCollectionWrites};
root.addEventListener&&root.addEventListener('online',flush);
root.addEventListener&&root.addEventListener('storage',function(event){if(event.key===QUEUE_KEY){dispatchState();flush();}});
migrateUnsafeCollectionWrites();
setTimeout(flush,600);
document.documentElement.setAttribute('data-persistence-reliability',VERSION);
})(window);
