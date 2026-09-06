(function(root){
'use strict';

var KEY='rb_idcards_v1';
var SHARED_PATH='/workflow_snapshots/idcards_shared_v1';
var LEGACY_PATH='/idcards';
var memoryJson='';
var knownRows={};
var localWriteVersion=0;
var nativeGet=Storage.prototype.getItem;
var nativeSet=Storage.prototype.setItem;

function isQuota(error){
  if(root.rbStorageResilience&&root.rbStorageResilience.isQuotaError)return root.rbStorageResilience.isQuotaError(error);
  return !!error&&(/quota|storage/i.test(String(error.message||''))||error.name==='QuotaExceededError'||error.code===22);
}

function compactUntilStored(storage,json){
  var rows;
  try{rows=JSON.parse(json);}catch(error){throw error;}
  if(!Array.isArray(rows))throw new Error('ข้อมูลบัตรประชาชนไม่ถูกต้อง');
  var compact=rows.map(function(row){
    var copy={};Object.keys(row||{}).forEach(function(key){copy[key]=row[key];});
    if(copy.photo&&typeof copy.photo==='object'){
      copy.photo={name:copy.photo.name||'',size:copy.photo.size||0,type:copy.photo.type||'image/jpeg',cloudOnly:true};
    }
    return copy;
  });
  nativeSet.call(storage,KEY,JSON.stringify(compact));
}

Storage.prototype.getItem=function(key){
  if(this===root.localStorage&&key===KEY&&memoryJson)return memoryJson;
  return nativeGet.call(this,key);
};

Storage.prototype.setItem=function(key,value){
  if(this!==root.localStorage||key!==KEY)return nativeSet.call(this,key,value);
  value=String(value);
  memoryJson=value;
  localWriteVersion++;
  try{return nativeSet.call(this,key,value);}catch(error){
    if(!isQuota(error))throw error;
    if(root.rbStorageResilience)root.rbStorageResilience.relieve();
    try{return nativeSet.call(this,key,value);}catch(retryError){
      if(!isQuota(retryError))throw retryError;
      compactUntilStored(this,value);
      root.__rbIdcardCacheCompacted=true;
    }
  }
};

function rowFingerprint(row){
  try{return JSON.stringify(row||{});}catch(error){return String(row&&row.updatedAt||'');}
}

function mergeChangedLocal(remoteRows,readVersion){
  var remote=(remoteRows||[]).filter(function(row){return row&&row.id;});
  if(localWriteVersion===readVersion)return remote;
  var local=[];try{local=JSON.parse(memoryJson||nativeGet.call(root.localStorage,KEY)||'[]');}catch(error){}
  if(!Array.isArray(local))local=Object.values(local||{});
  var byId={};remote.concat(local).forEach(function(row){
    if(!row||!row.id)return;var old=byId[row.id];
    if(!old||Number(row.updatedAt||0)>=Number(old.updatedAt||0))byId[row.id]=row;
  });
  return Object.values(byId);
}

var STATUS_ORDER={vacant:0,'':1,has:2,missing:3,expired:4};
function statusRank(value){
  value=value==null?'':String(value);
  return Object.prototype.hasOwnProperty.call(STATUS_ORDER,value)?STATUS_ORDER[value]:5;
}
function sortRecordsByStatus(rows){
  return (rows||[]).map(function(row,index){return{row:row,index:index};}).sort(function(a,b){
    return statusRank(a.row&&a.row.status)-statusRank(b.row&&b.row.status)||a.index-b.index;
  }).map(function(item){return item.row;});
}
function sortStatusRows(){
  var tbody=document.getElementById('ic-tbody');if(!tbody)return;
  var rows=Array.prototype.filter.call(tbody.children,function(row){return row.tagName==='TR'&&row.querySelector('select[data-icf="status"]');});
  if(rows.length<2)return;
  var sorted=rows.map(function(row,index){var select=row.querySelector('select[data-icf="status"]');return{row:row,index:index,rank:statusRank(select&&select.value)};}).sort(function(a,b){return a.rank-b.rank||a.index-b.index;});
  var changed=sorted.some(function(item,index){return item.row!==rows[index];});
  if(changed){var fragment=document.createDocumentFragment();sorted.forEach(function(item){fragment.appendChild(item.row);});tbody.appendChild(fragment);}
  sorted.forEach(function(item,index){if(item.row.cells&&item.row.cells[1])item.row.cells[1].textContent=String(index+1);});
  if(changed&&root.rbPageSizePagination&&typeof root.rbPageSizePagination.apply==='function')root.rbPageSizePagination.apply('idcard');
}

if(typeof root.addEventListener==='function')root.addEventListener('storage',function(event){
  if(event.storageArea===root.localStorage&&event.key===KEY)memoryJson=event.newValue||'';
});

function toast(message,state){
  var old=document.getElementById('ic-save-toast');if(old)old.remove();
  var el=document.createElement('div');el.id='ic-save-toast';el.setAttribute('role','status');el.setAttribute('aria-live','polite');
  el.className='ic-save-toast '+(state||'');el.textContent=message;document.body.appendChild(el);
  requestAnimationFrame(function(){el.classList.add('ic-save-toast-show');});
  setTimeout(function(){el.classList.remove('ic-save-toast-show');setTimeout(function(){if(el.parentNode)el.remove();},220);},3800);
}

function draftCount(){
  return Array.prototype.filter.call(document.querySelectorAll('#ic-add-panel .ic-add-row'),function(row){
    if(!row.querySelector('select'))return false;
    var text=Array.prototype.some.call(row.querySelectorAll('input[type="text"],select'),function(field){return !!String(field.value||'').trim();});
    var fileLabel=row.querySelector('label[title]');
    return text||!!(fileLabel&&fileLabel.getAttribute('title'));
  }).length;
}

function installCloudTracker(){
  if(typeof root.fbSet!=='function'||root.fbSet.__rbIdcardTracked)return;
  var original=root.fbSet;
  function trackedSet(path,value){
    if(path!==LEGACY_PATH&&path!==SHARED_PATH)return original.apply(this,arguments);
    var rows=value?(Array.isArray(value)?value:Object.values(value)).filter(function(row){return row&&row.id;}):[];
    var next={},writes=[];
    rows.forEach(function(row){
      var id=String(row.id).replace(/[.#$\[\]\/]/g,'_');next[id]=rowFingerprint(row);
      if(!Object.prototype.hasOwnProperty.call(knownRows,id)||knownRows[id]!==next[id])writes.push({path:SHARED_PATH+'/'+id,value:row});
    });
    Object.keys(knownRows).forEach(function(id){if(!Object.prototype.hasOwnProperty.call(next,id))writes.push({path:SHARED_PATH+'/'+id,value:null});});
    var result=writes.reduce(function(chain,write){return chain.then(function(ok){return Promise.resolve(original(write.path,write.value)).then(function(saved){return ok!==false&&saved!==false;});});},Promise.resolve(true)).then(function(ok){if(ok!==false)knownRows=next;return ok;});
    root.__rbIdcardLastSync=result;
    return result;
  }
  trackedSet.__rbIdcardTracked=true;
  trackedSet.__rbOriginal=original;
  root.fbSet=trackedSet;
}

function installCloudReader(){
  if(typeof root.fbGet!=='function'||root.fbGet.__rbIdcardShared)return;
  var originalGet=root.fbGet;
  function sharedGet(path,callback){
    if(path!==LEGACY_PATH)return originalGet.apply(this,arguments);
    var readVersion=localWriteVersion;
    originalGet(SHARED_PATH,function(sharedError,sharedData){
      var sharedRows=sharedData&&(Array.isArray(sharedData)?sharedData:Object.values(sharedData)).filter(function(row){return row&&row.id;});
      var isSupervisor=!!(root._rbUser&&root._rbUser.role==='sup');
      if(!isSupervisor){
        sharedRows=mergeChangedLocal(sharedRows||[],readVersion);knownRows={};sharedRows.forEach(function(row){knownRows[String(row.id).replace(/[.#$\[\]\/]/g,'_')]=rowFingerprint(row);});
        callback(sharedError,sharedRows);return;
      }
      originalGet(LEGACY_PATH,function(legacyError,legacyData){
        var legacyRows=legacyData&&(Array.isArray(legacyData)?legacyData:Object.values(legacyData)).filter(function(row){return row&&row.id;});
        var mergedById={};(sharedRows||[]).concat(legacyRows||[]).forEach(function(row){var id=String(row.id);var old=mergedById[id];if(!old||Number(row.updatedAt||0)>=Number(old.updatedAt||0))mergedById[id]=row;});
        var mergedRows=mergeChangedLocal(Object.values(mergedById),readVersion);
        if(mergedRows.length&&typeof root.fbSet==='function'){
          Promise.resolve(root.fbSet(LEGACY_PATH,mergedRows)).then(function(){callback(null,mergedRows);},function(){callback(null,mergedRows);});
          return;
        }
        callback(sharedError||legacyError,mergedRows);
      });
    });
  }
  sharedGet.__rbIdcardShared=true;
  sharedGet.__rbOriginal=originalGet;
  root.fbGet=sharedGet;
}

function teamRole(){var role=root._rbUser&&root._rbUser.role||'';return role==='ads'||role==='audit';}
function installTeamPermissions(){
  if(!root._rbUser||!teamRole())return;
  ['_icInit','_icEditField','_icUploadOne','_icRemovePhoto','_icBulkUpload','_icShowAddForm','_icRenderAddForm','_icSaveAllDrafts'].forEach(function(name){
    var original=root[name];if(typeof original!=='function'||original.__rbTeamAccess)return;
    function teamAccess(){var role=root._rbUser.role;root._rbUser.role='graphic';try{return original.apply(this,arguments);}finally{root._rbUser.role=role;}}
    teamAccess.__rbTeamAccess=true;teamAccess.__rbOriginal=original;root[name]=teamAccess;
  });
}

function enhanceSave(){
  if(typeof root._icSaveAllDrafts!=='function'||root._icSaveAllDrafts.__rbReliable)return;
  var original=root._icSaveAllDrafts;
  function reliableSave(){
    installCloudTracker();
    var count=draftCount();
    if(!count){toast('ยังไม่มีข้อมูลให้บันทึก กรุณากรอกอย่างน้อย 1 รายการ','ic-save-error');return false;}
    root.__rbIdcardLastSync=null;
    root.__rbIdcardCacheCompacted=false;
    var button=document.querySelector('#ic-add-panel button[onclick*="_icSaveAllDrafts"]');
    if(button){button.disabled=true;button.textContent='กำลังบันทึก '+count+' รายการ...';}
    try{
      original.apply(this,arguments);
      var result=root.__rbIdcardLastSync;
      if(!result){
        if(button){button.disabled=false;button.textContent='✓ บันทึกทั้งหมด';}
        toast('บันทึกในเครื่องแล้ว แต่ยังไม่พบการเชื่อมต่อระบบออนไลน์ กรุณาตรวจอินเทอร์เน็ต','ic-save-warning');
        return Promise.resolve(false);
      }
      return Promise.resolve(result).then(function(online){
        if(online===false){
          toast('เก็บรายการไว้ในเครื่องแล้ว แต่ยังซิงก์ออนไลน์ไม่สำเร็จ กรุณาตรวจอินเทอร์เน็ต','ic-save-warning');
          return false;
        }
        toast('บันทึก '+count+' รายการขึ้นระบบออนไลน์แล้ว','ic-save-success');
        if(root.__rbIdcardCacheCompacted)toast('บันทึกออนไลน์แล้ว พื้นที่เครื่องใกล้เต็มจึงลดเฉพาะรูปตัวอย่างในแคช','ic-save-warning');
        return true;
      },function(error){
        toast('เก็บรายการไว้ในเครื่องแล้ว แต่ซิงก์ออนไลน์ไม่สำเร็จ: '+(error&&error.message?error.message:'กรุณาลองอีกครั้ง'),'ic-save-warning');
        return false;
      });
    }catch(error){
      if(button){button.disabled=false;button.textContent='✓ บันทึกทั้งหมด';}
      toast('บันทึกไม่สำเร็จ: '+(error&&error.message?error.message:'กรุณาลองอีกครั้ง'),'ic-save-error');
      return false;
    }
  }
  reliableSave.__rbReliable=true;reliableSave.__rbOriginal=original;root._icSaveAllDrafts=reliableSave;
}

function enhanceAddForm(){
  var panel=document.getElementById('ic-add-panel');if(!panel||!panel.classList.contains('ic-show'))return;
  if(!panel.querySelector('.ic-add-help')){
    var title=panel.firstElementChild,help=document.createElement('div');help.className='ic-add-help';
    help.textContent='กรอกเฉพาะแถวที่ต้องการบันทึก ระบบจะข้ามแถวว่างและเก็บรูปขึ้นระบบออนไลน์';
    if(title)title.insertAdjacentElement('afterend',help);else panel.prepend(help);
  }
}

var observerTimer=null;
function scheduleEnhance(){if(observerTimer)return;observerTimer=setTimeout(function(){observerTimer=null;installCloudTracker();installCloudReader();installTeamPermissions();enhanceSave();enhanceAddForm();sortStatusRows();},80);}
var observer=new MutationObserver(function(mutations){for(var i=0;i<mutations.length;i++){for(var j=0;j<mutations[i].addedNodes.length;j++){var node=mutations[i].addedNodes[j];if(node.nodeType===1&&(node.id==='ic-root'||node.id==='ic-add-panel'||node.matches&&node.matches('[data-sub="idcard"],#ic-tbody tr')||node.querySelector&&node.querySelector('#ic-root,#ic-add-panel,[data-sub="idcard"],#ic-tbody tr'))){scheduleEnhance();return;}}}});
function start(){installCloudTracker();installCloudReader();installTeamPermissions();enhanceSave();enhanceAddForm();sortStatusRows();observer.observe(document.documentElement,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();

/* Authentication can change without reloading the page. Rebuild this view so
   it always uses the active user's shared read access instead of stale state. */
if(typeof root.addEventListener==='function')root.addEventListener('rb:auth-ready',function(){
  installCloudTracker();installCloudReader();installTeamPermissions();
  root._icDone=false;
  var panel=document.querySelector('.gsp[data-sub="idcard"]');
  if(panel&&panel.classList.contains('gsp-active')&&typeof root._icInit==='function')root._icInit();
});

root.rbIdcardReliability={isQuota:isQuota,enhanceSave:enhanceSave,installCloudTracker:installCloudTracker,installCloudReader:installCloudReader,rowFingerprint:rowFingerprint,mergeChangedLocal:mergeChangedLocal,statusRank:statusRank,sortRecordsByStatus:sortRecordsByStatus,sortStatusRows:sortStatusRows,getMemory:function(){return memoryJson;}};
})(window);
