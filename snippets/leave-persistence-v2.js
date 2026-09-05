(function(root){
'use strict';
if(root._rbLeavePersistenceV2Loaded)return;
root._rbLeavePersistenceV2Loaded=true;

var VERSION='3.2.0';
var LOCAL_KEY='lv_dash_v5';
var PENDING_KEY='rb_leave_pending_v2';
var CLOUD_PATH='/lv_data';
var active=false,retryTimer=null,remoteLoading=false,lastRevision=0,memoryPending=null,memoryLocal=null;

function clone(value){try{return JSON.parse(JSON.stringify(value));}catch(error){return value||{};}}
function object(value){return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}
function number(value){value=Number(value);return isFinite(value)&&value>0?value:0;}
function safeKey(value){return String(value||'').replace(/[.#$\[\]\/]/g,'_');}
function normalizeRows(value){
  var rows=[];
  if(Array.isArray(value))value.forEach(function(row,index){if(row&&typeof row==='object'){row=clone(row);if(!row.__cloudKey)row.__cloudKey=String(index);rows.push(row);}});
  else if(value&&typeof value==='object')Object.keys(value).forEach(function(key){var row=value[key];if(row&&typeof row==='object'){row=clone(row);if(!row.__cloudKey)row.__cloudKey=String(key);rows.push(row);}});
  return rows;
}
function normalizeData(value){var input=object(value),out={};Object.keys(input).forEach(function(key){out[key]=key.indexOf('__')===0?clone(input[key]):normalizeRows(input[key]);});return out;}
function cleanEntry(value){var entry=clone(value);if(entry&&typeof entry==='object')delete entry.__cloudKey;return entry;}
function entryKey(entry){return safeKey(entry&&entry.__cloudKey||('e_'+(number(entry&&entry.createdAt)||Date.now())+'_'+String(entry&&entry.empId||'emp')+'_'+(number(entry&&entry.uid)||1)));}
function readJson(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch(error){return null;}}
function writeJson(key,value){
  var json;try{json=JSON.stringify(value);}catch(error){return false;}
  try{localStorage.setItem(key,json);return true;}catch(error){
    try{if(root.rbStorageResilience&&typeof root.rbStorageResilience.relieve==='function')root.rbStorageResilience.relieve();}catch(ignore){}
    try{localStorage.setItem(key,json);return true;}catch(retryError){return false;}
  }
}
function nextRevision(){lastRevision=Math.max(Date.now(),lastRevision+1);return lastRevision;}
function normalize(value){value=object(value);return{d:normalizeData(value.d),u:number(value.u)||number(root.LV_UID)||1,t:number(value.t)||number(value.updatedAt),updatedBy:String(value.updatedBy||'')};}
function newer(stored,memory){stored=stored&&typeof stored==='object'?stored:null;memory=memory&&typeof memory==='object'?memory:null;if(!stored)return memory;if(!memory)return stored;return number(memory.t)>=number(stored.t)?memory:stored;}
function readLocal(){return normalize(newer(readJson(LOCAL_KEY),memoryLocal));}
function readPending(){var raw=newer(readJson(PENDING_KEY),memoryPending);if(!raw)return null;var value=normalize(raw);value.dirty=Array.isArray(raw.dirty)?raw.dirty.filter(Boolean):[];value.ops=object(raw.ops);return value;}
function saveLocal(envelope){var copy={d:clone(envelope.d),u:envelope.u,t:envelope.t,updatedAt:envelope.t,updatedBy:envelope.updatedBy||''};if(writeJson(LOCAL_KEY,copy)){memoryLocal=null;return true;}memoryLocal=copy;return false;}
function savePending(envelope){var copy=clone(envelope);if(writeJson(PENDING_KEY,copy)){memoryPending=null;return true;}memoryPending=copy;return false;}
function clearPending(){memoryPending=null;try{localStorage.removeItem(PENDING_KEY);}catch(error){}}
function currentUser(){return root._rbUser&&root._rbUser.name?String(root._rbUser.name):'';}
function unique(values){var seen={};return(values||[]).filter(function(value){value=String(value||'');if(!value||seen[value])return false;seen[value]=1;return true;});}
function render(){try{if(typeof root.lvRender==='function')root.lvRender();if(typeof root.lvRestorePhotos==='function')root.lvRestorePhotos();if(typeof root.rbRefreshOrderLeaveGuard==='function')root.rbRefreshOrderLeaveGuard();}catch(error){}}
function queueSnapshot(dirty,operations){
  var previous=readPending(),revision=nextRevision(),keys=unique((previous?previous.dirty:[]).concat(dirty||[])),ops=clone(previous&&previous.ops||{});
  Object.keys(object(operations)).forEach(function(path){ops[path]=clone(operations[path]);});
  var envelope={d:normalizeData(root.LV_DATA),u:number(root.LV_UID)||1,t:revision,updatedBy:currentUser(),dirty:keys,ops:ops};
  saveLocal(envelope);savePending(envelope);flush();return envelope;
}
function keyPath(key){return CLOUD_PATH+'/d/'+String(key).replace(/[.#$\[\]\/]/g,'_');}
function scheduleRetry(){clearTimeout(retryTimer);retryTimer=setTimeout(flush,5000);}
function cloudSet(path,value){if(typeof root.fbSet!=='function')return Promise.resolve(false);try{return Promise.resolve(root.fbSet(path,value)).then(function(ok){return ok!==false;},function(){return false;});}catch(error){return Promise.resolve(false);}}
function flush(){
  if(active)return;
  var pending=readPending();if(!pending||!pending.dirty.length)return;
  if(typeof root.fbSet!=='function'){scheduleRetry();return;}
  active=true;
  var chain=Promise.resolve(true);
  var operationPaths=Object.keys(object(pending.ops));
  if(operationPaths.length)operationPaths.forEach(function(path){chain=chain.then(function(ok){return ok?cloudSet(path,pending.ops[path]):false;});});
  else pending.dirty.forEach(function(key){chain=chain.then(function(ok){if(!ok)return false;var has=Object.prototype.hasOwnProperty.call(pending.d,key);return cloudSet(keyPath(key),has?pending.d[key]:null);});});
  chain=chain.then(function(ok){return ok?cloudSet(CLOUD_PATH+'/u',pending.u):false;});
  chain=chain.then(function(ok){return ok?cloudSet(CLOUD_PATH+'/updatedBy',pending.updatedBy||''):false;});
  chain=chain.then(function(ok){return ok?cloudSet(CLOUD_PATH+'/t',pending.t):false;});
  chain.then(function(ok){
    active=false;
    var latest=readPending();
    if(ok&&latest&&latest.t===pending.t)clearPending();
    if(!ok)scheduleRetry();else if(readPending())flush();
  },function(){active=false;scheduleRetry();});
}
function applyEnvelope(envelope){
  envelope=normalize(envelope);root.LV_DATA=clone(envelope.d);root.LV_UID=Math.max(number(root.LV_UID)||1,envelope.u||1);saveLocal(envelope);render();return envelope;
}
function mergePending(remote,pending){
  remote=normalize(remote);pending=pending||readPending();if(!pending)return remote;
  var data=clone(remote.d),local=object(pending.d);
  (pending.dirty||[]).forEach(function(key){if(Object.prototype.hasOwnProperty.call(local,key))data[key]=clone(local[key]);else delete data[key];});
  return{d:data,u:Math.max(remote.u||1,pending.u||1),t:Math.max(remote.t||0,pending.t||0),updatedBy:pending.updatedBy||remote.updatedBy||'',dirty:(pending.dirty||[]).slice(),ops:clone(pending.ops||{})};
}
function acceptRemote(remote){
  remote=normalize(remote);var local=readLocal(),pending=readPending();lastRevision=Math.max(lastRevision,remote.t,local.t,pending?pending.t:0);
  if(pending){var merged=mergePending(remote,pending);root.LV_DATA=clone(merged.d);root.LV_UID=Math.max(number(root.LV_UID)||1,merged.u||1);pending.d=clone(merged.d);pending.u=merged.u;savePending(pending);saveLocal({d:merged.d,u:merged.u,t:Math.max(local.t,pending.t,remote.t),updatedBy:pending.updatedBy});render();flush();return'pending-kept';}
  /* A request that started before the last successful save can finish after the
     save queue has already been acknowledged.  Never let that older snapshot
     replace the newer local copy; the next poll will receive the confirmed
     revision from Firebase. */
  if(local.t&&local.t>remote.t){root.LV_DATA=clone(local.d);root.LV_UID=Math.max(number(root.LV_UID)||1,local.u||1);render();return'stale-ignored';}
  if(remote.t||Object.keys(remote.d).length){applyEnvelope(remote);return'remote-applied';}
  return'empty-ignored';
}
function fetchRemote(){
  if(remoteLoading||typeof root.fbGet!=='function')return;
  remoteLoading=true;
  root.fbGet(CLOUD_PATH,function(error,remote){remoteLoading=false;if(error||!remote){flush();return;}acceptRemote(remote);});
}
function leavePageActive(){var panel=root.document&&root.document.getElementById&&root.document.getElementById('tab-schedule');return !!panel&&panel.classList.contains('active')&&!root.document.hidden;}
function saveAll(){var keys=Object.keys(object(root.LV_DATA));if(!keys.length)keys=['__empty__'];return queueSnapshot(keys);}
function saveDay(y,m,d,rows){
  var key=typeof root.lvDK==='function'?root.lvDK(y,m,d):(y+'-'+m+'-'+d),data=normalizeData(root.LV_DATA),before=normalizeRows(data[key]),next=[],keep={},ops={};
  (rows||[]).forEach(function(row){if(!row||typeof row!=='object')return;row=clone(row);row.__cloudKey=entryKey(row);keep[row.__cloudKey]=true;next.push(row);ops[keyPath(key)+'/'+safeKey(row.__cloudKey)]=cleanEntry(row);});
  before.forEach(function(row){var storage=entryKey(row);if(!keep[storage])ops[keyPath(key)+'/'+safeKey(storage)]=null;});
  if(!next.length)delete data[key];else data[key]=next;
  root.LV_DATA=data;return queueSnapshot([key],ops);
}
function waitForSync(timeout){
  timeout=Math.max(500,Number(timeout)||4500);
  return new Promise(function(resolve){var started=Date.now();(function check(){if(!readPending()){resolve(true);return;}if(Date.now()-started>=timeout){resolve(false);return;}setTimeout(check,120);})();});
}
function load(){var local=readLocal();lastRevision=Math.max(lastRevision,local.t);if(Object.keys(local.d).length){root.LV_DATA=clone(local.d);root.LV_UID=Math.max(number(root.LV_UID)||1,local.u||1);render();}if(leavePageActive()||readPending())fetchRemote();flush();}
function install(){
  if(typeof root.lvSaveLS!=='function'||typeof root.lvSaveDay!=='function')return setTimeout(install,200);
  root.lvSaveLS=saveAll;root.lvSaveDay=saveDay;root.lvLoadLS=load;
  if(root._lvPoll){clearInterval(root._lvPoll);root._lvPoll=null;}
  root._lvPoll=setInterval(function(){if(leavePageActive()||readPending())fetchRemote();flush();},60000);
  if(root.document&&root.document.documentElement)root.document.documentElement.setAttribute('data-leave-persistence',VERSION);
  load();
}

root.addEventListener&&root.addEventListener('online',flush);
root.document&&root.document.addEventListener&&root.document.addEventListener('click',function(event){var button=event.target&&event.target.closest&&event.target.closest('#sidebar button,#rb-bottom-nav button');if(button&&String(button.textContent||'').indexOf('วันหยุด')>=0)setTimeout(fetchRemote,0);});
root.document&&root.document.addEventListener&&root.document.addEventListener('visibilitychange',function(){if(leavePageActive())fetchRemote();});
root.addEventListener&&root.addEventListener('storage',function(event){if(event.key===PENDING_KEY)flush();if(event.key===LOCAL_KEY&&!readPending()){var next=readLocal();if(next.t>lastRevision){lastRevision=next.t;applyEnvelope(next);}}});
root.rbLeavePersistence={version:VERSION,waitForSync:waitForSync,flush:flush,pending:function(){return!!readPending();}};
root._rbLeavePersistenceTest={normalize:normalize,normalizeData:normalizeData,mergePending:mergePending,acceptRemote:acceptRemote,readPending:readPending,flush:flush,waitForSync:waitForSync,version:VERSION};
install();
})(window);
