(function(root){
'use strict';
var storage=root.localStorage;
var ORDER_MEMORY_KEY='__rbOrdersMemoryV1';
var ORDER_SNAPSHOT_KEY='__rbOrdersSnapshotV1';

function quotaError(error){
  if(!error)return false;
  return error.name==='QuotaExceededError'||error.name==='NS_ERROR_DOM_QUOTA_REACHED'||error.code===22||error.code===1014||/quota|storage/i.test(String(error.message||''));
}
function readJson(key,fallback){
  try{var value=JSON.parse(storage.getItem(key)||'null');return value==null?fallback:value;}catch(error){return fallback;}
}
function writeString(key,value){
  try{storage.setItem(key,value);return{ok:true,error:null};}catch(error){return{ok:false,error:error};}
}
function compactAsset(value){
  if(!value||typeof value!=='object')return value;
  var out={};
  ['name','type','size','url','path','id','updatedAt'].forEach(function(key){if(value[key]!=null&&key!=='data')out[key]=value[key];});
  if(!Object.keys(out).length)return null;
  out.localPreviewRemoved=true;
  return out;
}
function compactOrders(rows){
  return (Array.isArray(rows)?rows:[]).map(function(row){
    if(!row||typeof row!=='object')return row;
    var copy={};Object.keys(row).forEach(function(key){copy[key]=row[key];});
    ['images','briefImages','errorImages','fixImages'].forEach(function(key){
      if(Array.isArray(copy[key]))copy[key]=copy[key].map(compactAsset).filter(Boolean);
    });
    copy._rbCacheCompacted=true;
    return copy;
  });
}
function trimTimeline(rows,limit){
  return (Array.isArray(rows)?rows:[]).slice(0,limit).map(function(item){
    if(!item||typeof item!=='object')return item;
    var out={};['ts','sec','act','det','user','leaveType','leaveEmp','jn','jt','as'].forEach(function(key){if(item[key]!=null)out[key]=item[key];});
    if(typeof out.det==='string'&&out.det.length>500)out.det=out.det.slice(0,500)+'…';
    return out;
  });
}
function relieve(){
  try{storage.removeItem('rb_orders_last_good_v1');}catch(error){}
  var timeline=readJson('rb_timeline_v1',[]);
  if(Array.isArray(timeline)&&timeline.length){
    var limits=[150,80,40];
    for(var i=0;i<limits.length;i++){
      if(writeString('rb_timeline_v1',JSON.stringify(trimTimeline(timeline,limits[i]))).ok)break;
    }
  }
}
function ensureHeadroom(bytes){
  bytes=Math.max(8192,Number(bytes)||32768);
  var probe='__rb_storage_probe_v1';
  try{
    storage.setItem(probe,new Array(bytes+1).join('0'));
    storage.removeItem(probe);
    return true;
  }catch(error){
    try{storage.removeItem(probe);}catch(ignore){}
    if(!quotaError(error))return false;
    relieve();
    try{
      storage.setItem(probe,new Array(bytes+1).join('0'));
      storage.removeItem(probe);
      return true;
    }catch(retryError){
      try{storage.removeItem(probe);}catch(ignoreRetry){}
      return false;
    }
  }
}
function storeTimeline(rows,key){
  key=key||'rb_timeline_v1';
  var limits=[300,150,80,30,0],lastError=null;
  for(var i=0;i<limits.length;i++){
    var result=writeString(key,JSON.stringify(trimTimeline(rows,limits[i])));
    if(result.ok)return{ok:true,count:Math.min((rows||[]).length,limits[i]),compacted:limits[i]<300};
    lastError=result.error;
    if(!quotaError(lastError))break;
  }
  return{ok:false,count:0,compacted:true,error:lastError};
}
function storeOrders(rows,key){
  key=key||'rb_orders_v1';rows=Array.isArray(rows)?rows:[];
  var full=JSON.stringify(rows),result=writeString(key,full);
  /* Keep an immutable copy of the last committed order state.  The live
     in-memory array is intentionally mutable for rendering speed, so it must
     never be used as the "before" value when building a Firebase patch. */
  root[ORDER_SNAPSHOT_KEY]=full;
  root[ORDER_MEMORY_KEY]=rows;
  if(result.ok)return{ok:true,compact:false,memory:true};
  if(quotaError(result.error)){
    relieve();
    result=writeString(key,full);
    if(result.ok)return{ok:true,compact:false,memory:true,recovered:true};
    var compact=JSON.stringify(compactOrders(rows));
    result=writeString(key,compact);
    if(result.ok)return{ok:true,compact:true,memory:true,recovered:true};
  }
  return{ok:false,compact:false,memory:true,error:result.error};
}
function loadOrders(key){
  key=key||'rb_orders_v1';
  if(Array.isArray(root[ORDER_MEMORY_KEY]))return root[ORDER_MEMORY_KEY];
  var rows=readJson(key,[]);rows=Array.isArray(rows)?rows:[];
  try{root[ORDER_SNAPSHOT_KEY]=JSON.stringify(rows);}catch(error){}
  return rows;
}
function loadOrderSnapshot(key){
  key=key||'rb_orders_v1';
  var raw=root[ORDER_SNAPSHOT_KEY];
  if(typeof raw==='string')try{var rows=JSON.parse(raw);return Array.isArray(rows)?rows:[];}catch(error){}
  var persisted=readJson(key,[]);return Array.isArray(persisted)?persisted:[];
}
function clearOrderMemory(){root[ORDER_MEMORY_KEY]=null;root[ORDER_SNAPSHOT_KEY]=null;}

root.rbStorageResilience={
  isQuotaError:quotaError,
  readJson:readJson,
  compactOrders:compactOrders,
  storeTimeline:storeTimeline,
  storeOrders:storeOrders,
  loadOrders:loadOrders,
  loadOrderSnapshot:loadOrderSnapshot,
  clearOrderMemory:clearOrderMemory,
  relieve:relieve,
  ensureHeadroom:ensureHeadroom
};
ensureHeadroom();
})(window);
