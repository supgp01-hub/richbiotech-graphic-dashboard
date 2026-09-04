(function(root){
'use strict';
if(root.rbDurableOrderQueue)return;

var DB_NAME='richbiotech_durable_v1';
var STORE_NAME='state';
var QUEUE_KEY='order_write_queue_v1';
var writeChain=Promise.resolve();

function clone(value){try{return JSON.parse(JSON.stringify(value));}catch(error){return value;}}
function openDb(){
  return new Promise(function(resolve){
    if(!root.indexedDB){resolve(null);return;}
    var request;
    try{request=root.indexedDB.open(DB_NAME,1);}catch(error){resolve(null);return;}
    request.onupgradeneeded=function(){var db=request.result;if(!db.objectStoreNames.contains(STORE_NAME))db.createObjectStore(STORE_NAME);};
    request.onsuccess=function(){resolve(request.result);};
    request.onerror=function(){resolve(null);};
    request.onblocked=function(){resolve(null);};
  });
}

var ready=openDb();
function loadKey(key){
  return ready.then(function(db){
    if(!db)return[];
    return new Promise(function(resolve){
      var tx,request;
      try{tx=db.transaction(STORE_NAME,'readonly');request=tx.objectStore(STORE_NAME).get(key);}catch(error){resolve([]);return;}
      request.onsuccess=function(){var value=request.result;resolve(Array.isArray(value)?clone(value):[]);};
      request.onerror=function(){resolve([]);};
    });
  });
}
function saveKey(key,queue){
  var snapshot=clone(Array.isArray(queue)?queue:[]);
  writeChain=writeChain.then(function(){
    return ready.then(function(db){
      if(!db)return false;
      return new Promise(function(resolve){
        var tx;
        try{tx=db.transaction(STORE_NAME,'readwrite');tx.objectStore(STORE_NAME).put(snapshot,key);}catch(error){resolve(false);return;}
        tx.oncomplete=function(){resolve(true);};
        tx.onerror=function(){resolve(false);};
        tx.onabort=function(){resolve(false);};
      });
    });
  },function(){return false;});
  return writeChain;
}
function load(){return loadKey(QUEUE_KEY);}
function save(queue){return saveKey(QUEUE_KEY,queue);}
function persist(queue,storageKey,memoryFallback){
  queue=Array.isArray(queue)?queue:[];var local=false;
  try{root.localStorage.setItem(storageKey,JSON.stringify(queue));local=true;}
  catch(error){if(root.rbStorageResilience)root.rbStorageResilience.relieve();try{root.localStorage.setItem(storageKey,JSON.stringify(queue));local=true;}catch(retryError){}}
  if(typeof memoryFallback==='function')memoryFallback(local?[]:queue.slice());
  return{durable:local,promise:save(queue).then(function(ok){return local||ok;},function(){return local;})};
}
function restore(current){
  return load().then(function(saved){var byPath={};(Array.isArray(saved)?saved:[]).concat(Array.isArray(current)?current:[]).forEach(function(item){if(!item||!item.path)return;var old=byPath[item.path];if(!old||Number(item.ts||0)>=Number(old.ts||0))byPath[item.path]=item;});return Object.keys(byPath).map(function(path){return byPath[path];}).sort(function(a,b){return Number(a.ts||0)-Number(b.ts||0);});});
}
function accept(path,online){
  var durable=root.rbPersistence&&typeof root.rbPersistence.waitDurable==='function'?root.rbPersistence.waitDurable(path):null;if(!durable)return Promise.resolve(online);
  return new Promise(function(resolve){var left=2;function done(ok){if(ok){resolve(true);return;}if(!--left)resolve(false);}Promise.resolve(online).then(done,function(){done(false);});Promise.resolve(durable).then(done,function(){done(false);});});
}

root.rbDurableOrderQueue={version:'1.0.0',load:load,save:save,loadKey:loadKey,saveKey:saveKey,persist:persist,restore:restore,accept:accept,ready:ready};
})(window);
