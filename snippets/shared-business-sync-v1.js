(function(root){
'use strict';
if(root._rbSharedBusinessSyncLoaded)return;
root._rbSharedBusinessSyncLoaded=true;

var VERSION='1.2.0',PULL_MS=60000,FOCUS_THROTTLE_MS=15000,MIGRATION_PREFIX='rb_shared_online_migrated_v1:',muted=false,pullTimer=null,lastPullAt=0,pullQueued=false;
var nativeSet=Storage.prototype.setItem,nativeRemove=Storage.prototype.removeItem;
var descriptors={
  rb_brand_pages_v1:{path:'/brand_pages_v1',kind:'grouped'},
  rb_channel_data_v1:{path:'/channel_data_v1',kind:'grouped'},
  rb_fb_cells:{path:'/facebook_legacy_cells',kind:'map'},
  rb_fb_notif:{path:'/facebook_notifications',kind:'map'},
  rb_timeline_v1:{path:'/timeline_v1',kind:'timeline'}
};

function clone(value){try{return JSON.parse(JSON.stringify(value));}catch(error){return value;}}
function parse(value,fallback){try{var parsed=JSON.parse(value);return parsed==null?fallback:parsed;}catch(error){return fallback;}}
function safe(value){return String(value||'item').replace(/[.#$\[\]\/]/g,'_');}
function hash(value){var text=String(value||''),h=2166136261;for(var i=0;i<text.length;i++){h^=text.charCodeAt(i);h+=(h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24);}return(h>>>0).toString(36);}
function user(){return root._rbUser&&root._rbUser.name||'';}
function same(a,b){try{return JSON.stringify(a)===JSON.stringify(b);}catch(error){return false;}}
function localValue(key,kind){return parse(localStorage.getItem(key),kind==='timeline'||kind==='whole'?[]:{});}
function descriptorFor(key){if(descriptors[key])return descriptors[key];var prefix='rb_order_draft_v1_';if(String(key||'').indexOf(prefix)===0)return{path:'/order_form_drafts/'+safe(String(key).slice(prefix.length)||'guest'),kind:'whole',dynamic:true};return null;}
function setLocal(key,value){muted=true;try{nativeSet.call(localStorage,key,JSON.stringify(value));}finally{muted=false;}}
function cloud(path,value){if(typeof root.fbSet!=='function')return Promise.resolve(false);try{return Promise.resolve(root.fbSet(path,value));}catch(error){return Promise.resolve(false);}}

function identity(row,index,group){return row&&row._syncId||'legacy_'+hash(group+'|'+String(row&&row.id||row&&row.name||row&&row.email||row&&row.employee||'row')+'|'+index);}
function normalizeGrouped(value,before){
  var out={},old=before&&typeof before==='object'?before:{};
  Object.keys(value&&typeof value==='object'?value:{}).forEach(function(group){
    var rows=Array.isArray(value[group])?value[group]:[],oldRows=Array.isArray(old[group])?old[group]:[];
    out[group]=rows.map(function(source,index){
      var row=source&&typeof source==='object'?clone(source):{name:String(source||'')};
      var previous=oldRows[index]&&typeof oldRows[index]==='object'?oldRows[index]:null;
      row._syncId=row._syncId||previous&&previous._syncId||identity(row,index,group);
      var clean=clone(row);delete clean._updatedAt;delete clean._updatedBy;
      var oldClean=previous?clone(previous):null;if(oldClean){delete oldClean._updatedAt;delete oldClean._updatedBy;}
      if(!previous||!same(clean,oldClean)){row._updatedAt=Date.now();row._updatedBy=user();}
      else{row._updatedAt=previous._updatedAt||0;row._updatedBy=previous._updatedBy||'';}
      return row;
    });
  });return out;
}
function groupedMap(value){var out={};Object.keys(value||{}).forEach(function(group){(value[group]||[]).forEach(function(row,index){var id=identity(row,index,group);out[group+'|'+id]={group:group,id:id,row:row};});});return out;}
function syncGrouped(desc,before,after){var oldMap=groupedMap(before),newMap=groupedMap(after),writes=[];Object.keys(newMap).forEach(function(key){var item=newMap[key],old=oldMap[key];if(!old||!same(old.row,item.row))writes.push(cloud(desc.path+'/'+safe(item.group)+'/'+safe(item.id),item.row));});Object.keys(oldMap).forEach(function(key){if(!newMap[key]){var item=oldMap[key];writes.push(cloud(desc.path+'/'+safe(item.group)+'/'+safe(item.id),null));}});return writes;}
function groupedFromCloud(value){var out={};Object.keys(value&&typeof value==='object'?value:{}).forEach(function(group){var node=value[group],rows=[];if(Array.isArray(node))rows=node.filter(Boolean);else if(node&&typeof node==='object')Object.keys(node).forEach(function(id){if(node[id])rows.push(node[id]);});out[group]=rows;});return out;}
function mergeGrouped(local,remote){var left=normalizeGrouped(local,local),right=normalizeGrouped(remote,remote),out=clone(right),seen=groupedMap(right);Object.keys(left).forEach(function(group){if(!out[group])out[group]=[];(left[group]||[]).forEach(function(row,index){var id=identity(row,index,group),key=group+'|'+id,current=seen[key]&&seen[key].row;if(!current){out[group].push(row);seen[key]={group:group,id:id,row:row};return;}if(Number(row._updatedAt||0)>Number(current._updatedAt||0)){var at=out[group].findIndex(function(item,i){return identity(item,i,group)===id;});if(at>=0)out[group][at]=row;}});});return out;}

function mapEntries(value){var out={};Object.keys(value&&typeof value==='object'?value:{}).forEach(function(key){out[key]={key:key,value:value[key]};});return out;}
function syncMap(desc,before,after){var oldMap=mapEntries(before),newMap=mapEntries(after),writes=[];Object.keys(newMap).forEach(function(key){if(!oldMap[key]||!same(oldMap[key].value,newMap[key].value))writes.push(cloud(desc.path+'/'+safe(hash(key)),{key:key,value:newMap[key].value,updatedAt:Date.now(),updatedBy:user()}));});Object.keys(oldMap).forEach(function(key){if(!newMap[key])writes.push(cloud(desc.path+'/'+safe(hash(key)),null));});return writes;}
function mapFromCloud(value){var out={};Object.keys(value&&typeof value==='object'?value:{}).forEach(function(id){var entry=value[id];if(entry&&typeof entry==='object'&&Object.prototype.hasOwnProperty.call(entry,'key'))out[entry.key]=entry.value;});return out;}
function mergeMap(local,remote){var out=clone(remote||{});Object.keys(local&&typeof local==='object'?local:{}).forEach(function(key){if(!Object.prototype.hasOwnProperty.call(out,key))out[key]=local[key];});return out;}

function timelineMap(value){var out={};(Array.isArray(value)?value:[]).forEach(function(row,index){if(row)out[String(row._syncId||row.ts||('legacy_'+index))]=row;});return out;}
function normalizeTimeline(value){return(Array.isArray(value)?value:[]).map(function(source,index){var row=clone(source||{});row._syncId=String(row._syncId||row.ts||('legacy_'+hash(JSON.stringify(row)+'|'+index)));return row;});}
function syncTimeline(desc,before,after){var oldMap=timelineMap(before),newMap=timelineMap(after),writes=[];Object.keys(newMap).forEach(function(id){if(!oldMap[id]||!same(oldMap[id],newMap[id]))writes.push(cloud(desc.path+'/'+safe(id),newMap[id]));});Object.keys(oldMap).forEach(function(id){if(!newMap[id])writes.push(cloud(desc.path+'/'+safe(id),null));});return writes;}
function timelineFromCloud(value){var rows=[];if(Array.isArray(value))rows=value.filter(Boolean);else Object.keys(value&&typeof value==='object'?value:{}).forEach(function(id){if(value[id])rows.push(value[id]);});return normalizeTimeline(rows).sort(function(a,b){return Number(b.ts||0)-Number(a.ts||0);}).slice(0,300);}
function mergeTimeline(local,remote){var out=timelineMap(remote);Object.keys(timelineMap(local)).forEach(function(id){if(!out[id])out[id]=timelineMap(local)[id];});return Object.keys(out).map(function(id){return out[id];}).sort(function(a,b){return Number(b.ts||0)-Number(a.ts||0);}).slice(0,300);}

function prepare(desc,value,before){if(desc.kind==='grouped')return normalizeGrouped(value,before);if(desc.kind==='timeline')return normalizeTimeline(value);return value;}
function sync(desc,before,after){if(desc.kind==='grouped')return syncGrouped(desc,before,after);if(desc.kind==='map')return syncMap(desc,before,after);if(desc.kind==='timeline')return syncTimeline(desc,before,after);return[cloud(desc.path,after)];}
function refreshUi(key){try{if((key==='rb_brand_pages_v1'||key==='rb_channel_data_v1')&&typeof root.updateCounts==='function')root.updateCounts();if(key==='rb_brand_pages_v1'&&document.getElementById('fbm-body')&&typeof root.refreshFB==='function')root.refreshFB();if(key==='rb_channel_data_v1'&&document.getElementById('chm-body')&&typeof root.refreshCH==='function')root.refreshCH();if(key==='rb_timeline_v1'&&document.getElementById('rb-tl-list')&&typeof root.renderTLList==='function')root.renderTLList(root._tlCurSec||null);}catch(error){}}

Storage.prototype.setItem=function(key,value){var desc=this===root.localStorage&&!muted?descriptorFor(key):null;if(!desc)return nativeSet.call(this,key,value);var before=localValue(key,desc.kind),incoming=parse(String(value),desc.kind==='timeline'||desc.kind==='whole'?[]:{}),after=prepare(desc,incoming,before);var result=nativeSet.call(this,key,JSON.stringify(after));sync(desc,before,after);return result;};
Storage.prototype.removeItem=function(key){var desc=this===root.localStorage&&!muted?descriptorFor(key):null,result=nativeRemove.call(this,key);if(desc)cloud(desc.path,null);return result;};

function migrated(key){try{return localStorage.getItem(MIGRATION_PREFIX+key)==='1';}catch(error){return false;}}
function markMigrated(key){try{muted=true;nativeSet.call(localStorage,MIGRATION_PREFIX+key,'1');}finally{muted=false;}}
function hydrateOne(key,desc){if(typeof root.fbGet!=='function')return;root.fbGet(desc.path,function(error,remote){if(error)return;var local=localValue(key,desc.kind),hasRemote=remote&&typeof remote==='object'&&Object.keys(remote).length>0;if(!hasRemote){var hasLocal=Array.isArray(local)?local.length>0:Object.keys(local||{}).length>0;if(hasLocal){var normalized=prepare(desc,local,local);setLocal(key,normalized);sync(desc,desc.kind==='timeline'||desc.kind==='whole'?[]:{},normalized);}markMigrated(key);return;}var value=desc.kind==='grouped'?groupedFromCloud(remote):desc.kind==='map'?mapFromCloud(remote):desc.kind==='timeline'?timelineFromCloud(remote):remote;if(!migrated(key)&&desc.kind!=='whole'){var merged=desc.kind==='grouped'?mergeGrouped(local,value):desc.kind==='map'?mergeMap(local,value):mergeTimeline(local,value);setLocal(key,merged);sync(desc,value,merged);value=merged;markMigrated(key);}else if(!migrated(key))markMigrated(key);setLocal(key,value);refreshUi(key);});}
function canPull(){return !document.hidden&&(typeof navigator==='undefined'||navigator.onLine!==false)&&(!root.rbMultiTab||root.rbMultiTab.isLeader());}
function schedulePull(delay){clearTimeout(pullTimer);pullTimer=setTimeout(function(){pull(false);},Math.max(250,Number(delay)||PULL_MS));}
function pull(force){
  if(!canPull()){schedulePull(PULL_MS);return false;}
  var now=Date.now(),wait=FOCUS_THROTTLE_MS-(now-lastPullAt);
  if(!force&&wait>0){schedulePull(wait);return false;}
  if(pullQueued)return false;
  pullQueued=true;lastPullAt=now;
  Object.keys(descriptors).forEach(function(key){hydrateOne(key,descriptors[key]);});
  var who=root._rbUser&&root._rbUser.name;if(who){var draftKey='rb_order_draft_v1_'+encodeURIComponent(who);hydrateOne(draftKey,descriptorFor(draftKey));}
  setTimeout(function(){pullQueued=false;},800);
  schedulePull(PULL_MS);return true;
}
function flush(){if(root.rbPersistence&&typeof root.rbPersistence.flush==='function')root.rbPersistence.flush();}

root.rbSharedBusinessSync={version:VERSION,descriptors:clone(descriptors),descriptorFor:descriptorFor,pull:pull,flush:flush,safe:safe,hash:hash,normalizeGrouped:normalizeGrouped,groupedFromCloud:groupedFromCloud,mergeGrouped:mergeGrouped,mapFromCloud:mapFromCloud,mergeMap:mergeMap,timelineFromCloud:timelineFromCloud,mergeTimeline:mergeTimeline};
root.addEventListener&&root.addEventListener('online',function(){pull(true);flush();});
root.addEventListener&&root.addEventListener('focus',function(){pull(false);flush();});
root.addEventListener&&root.addEventListener('rb:leader-change',function(event){if(event.detail&&event.detail.leader)pull(true);});
document.addEventListener&&document.addEventListener('visibilitychange',function(){if(!document.hidden){pull(false);flush();}});
setTimeout(function(){pull(true);},150);
document.documentElement.setAttribute('data-shared-business-sync',VERSION);
})(window);
