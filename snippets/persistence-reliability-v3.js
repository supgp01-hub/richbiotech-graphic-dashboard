(function(root){
'use strict';
if(root._rbPersistenceReliabilityV3Loaded)return;
root._rbPersistenceReliabilityV3Loaded=true;

var VERSION='3.3.2';
var QUEUE_KEY='rb_generic_write_queue_v3';
var RETRY_MS=5000;
var MAX_RETRY_MS=30000;
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
function safeKey(value){return String(value||'item').replace(/[^a-zA-Z0-9_-]/g,'_');}
function collectionEntries(path,value,entry){
  var rows=[];
  if(Array.isArray(value))rows=value;
  else if(value&&typeof value==='object')Object.keys(value).forEach(function(key){var row=value[key];if(row&&typeof row==='object'){if(!row.id)row=Object.assign({id:key},row);rows.push(row);}});
  return rows.filter(function(row){return row&&row.id;}).map(function(row,index){
    var key=path==='/orders'?safeKey(row._fbKey||((row.sourceDraftId?'planner_':'order_')+safeKey(row.sourceDraftId||row.id))):safeKey(row.id);
    var data=clone(row);if(data&&data._fbKey)delete data._fbKey;
    return{token:(entry&&entry.token||'sync')+'_item_'+index,path:path+'/'+key,data:data,ts:Number(entry&&entry.ts||Date.now())+index};
  });
}
function isSplitCollection(path){return path==='/order_planner/drafts'||path==='/orders'||path==='/workflow_snapshots/idcards_shared_v1';}
function migrateUnsafeCollectionWrites(){
  var queue=readQueue(),next=[],changed=false;
  queue.forEach(function(entry){
    var path=entry&&pathOf(entry.path);
    if(!isSplitCollection(path)){next.push(entry);return;}
    changed=true;
    collectionEntries(path,entry.data,entry).forEach(function(child){
      for(var i=next.length-1;i>=0;i--)if(pathOf(next[i]&&next[i].path)===pathOf(child.path))next.splice(i,1);
      next.push(child);
    });
  });
  if(changed)writeQueue(next);
  return changed;
}
function removeDeniedLegacyWrites(){
  var queue=readQueue(),next=queue.filter(function(entry){return pathOf(entry&&entry.path)!=='/rb_users';});
  if(next.length!==queue.length){writeQueue(next);dispatchState();return true;}
  return false;
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
  var queue=readQueue(),count=queue.length,retrying=queue.some(function(item){return Number(item&&item.attempts||0)>0;});
  try{root.dispatchEvent(new CustomEvent('rb:persistence-state',{detail:{pending:count,version:VERSION}}));}catch(error){}
  if(count)setChip(typeof navigator!=='undefined'&&navigator.onLine===false||retrying?'waiting':'saving',typeof navigator!=='undefined'&&navigator.onLine===false?'รออินเทอร์เน็ต':retrying?'รอซิงก์ใหม่ '+count+' รายการ':'รอซิงก์ '+count+' รายการ','ข้อมูลในเครื่องปลอดภัยและจะซิงก์อัตโนมัติ โดยรายการที่ติดขัดจะไม่ขวางรายการอื่น');
}
function retryDelay(attempts){return Math.min(MAX_RETRY_MS,RETRY_MS*Math.max(1,Math.pow(2,Math.min(3,Number(attempts||1)-1))));}
function markRetry(token){
  var queue=readQueue(),now=Date.now(),changed=false;
  queue.forEach(function(item){if(!item||item.token!==token)return;item.attempts=Number(item.attempts||0)+1;item.nextAttemptAt=now+retryDelay(item.attempts);changed=true;});
  if(changed)writeQueue(queue);dispatchState();
}
function schedule(){
  clearTimeout(retryTimer);
  var now=Date.now(),next=readQueue().reduce(function(value,item){var due=Number(item&&item.nextAttemptAt||0);return due>now&&(!value||due<value)?due:value;},0);
  retryTimer=setTimeout(function(){flush(false);},next?Math.max(250,next-now):RETRY_MS);
}
function hasReady(excludeToken){var now=Date.now();return readQueue().some(function(item){return item&&item.token!==excludeToken&&!active[item.token]&&!activePaths[pathOf(item.path)]&&Number(item.nextAttemptAt||0)<=now;});}
function attempt(entry,initial){
  if(!entry||active[entry.token]||activePaths[pathOf(entry.path)])return Promise.resolve(false);
  if(typeof navigator!=='undefined'&&navigator.onLine===false){dispatchState();schedule();return Promise.resolve(false);}
  if(typeof originalSet!=='function'){dispatchState();schedule();return Promise.resolve(false);}
  active[entry.token]=true;activePaths[pathOf(entry.path)]=entry.token;
  return Promise.resolve().then(function(){return originalSet(entry.path,clone(entry.data));}).then(function(ok){
    delete active[entry.token];delete activePaths[pathOf(entry.path)];
    if(ok===false){markRetry(entry.token);if(hasReady(entry.token))setTimeout(function(){flush(false);},0);else schedule();return false;}
    removeWrite(entry.token);
    if(pendingCount())setTimeout(function(){flush(false);},0);
    return true;
  },function(){delete active[entry.token];delete activePaths[pathOf(entry.path)];markRetry(entry.token);if(hasReady(entry.token))setTimeout(function(){flush(false);},0);else schedule();return false;});
}
function flush(force){
  clearTimeout(retryTimer);
  if(typeof navigator!=='undefined'&&navigator.onLine===false){dispatchState();return;}
  var queue=readQueue(),entry=null,now=Date.now();
  for(var i=0;i<queue.length;i++){if(queue[i]&&!active[queue[i].token]&&!activePaths[pathOf(queue[i].path)]&&(force||Number(queue[i].nextAttemptAt||0)<=now)){entry=queue[i];break;}}
  if(!entry){dispatchState();if(queue.length)schedule();return;}
  attempt(entry,false).then(function(ok){if(ok&&pendingCount())flush(!!force);});
}

root.fbSet=function reliableFbSet(path,data){
  path=pathOf(path);
  if(isSplitCollection(path)&&data!==null){
    var children=collectionEntries(path,data);
    if(!children.length)return Promise.resolve(true);
    return Promise.all(children.map(function(child){return root.fbSet(child.path,child.data);})).then(function(results){return results.every(function(ok){return ok!==false;});});
  }
  if(isSplitCollection(path)&&data===null){dispatchState();return Promise.resolve(false);}
  var entry=queueWrite(path,data);if(activePaths[entry.path]){schedule();return Promise.resolve(false);}return attempt(entry,true);
};
root.fbGet=function reliableFbGet(path,callback){
  if(typeof originalGet!=='function'){callback(new Error('ไม่พบระบบอ่านข้อมูล'),overlay(path,null));return;}
  originalGet(path,function(error,data){
    var pending=relatedPending(path);
    callback(error&&pending?null:error,overlay(path,data));
  });
};
root.rbPersistence={version:VERSION,pendingCount:pendingCount,flush:function(){flush(true);},overlay:overlay,queue:readQueue,related:relatedPending,migrateUnsafeCollectionWrites:migrateUnsafeCollectionWrites,removeDeniedLegacyWrites:removeDeniedLegacyWrites,collectionEntries:collectionEntries};
root.addEventListener&&root.addEventListener('online',function(){flush(true);});
root.addEventListener&&root.addEventListener('storage',function(event){if(event.key===QUEUE_KEY){dispatchState();flush(false);}});
migrateUnsafeCollectionWrites();
removeDeniedLegacyWrites();
setTimeout(function(){flush(false);},600);
document.documentElement.setAttribute('data-persistence-reliability',VERSION);
})(window);
