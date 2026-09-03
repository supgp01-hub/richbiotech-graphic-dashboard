const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

(async()=>{
  const listeners = {};
  const storage = new Map();
  const remoteRows = Array.from({length:2428},(_,i)=>({id:`cloud-${i}`,brand:'So Pink'}));
  const window = {
    __CT_IMPORT_TEST__: true,
    addEventListener(name,handler){listeners[name]=handler;},
    dispatchEvent(){},
    fbGet(path,callback){assert.equal(path,'/content_tracker_v2');callback(null,{items:remoteRows});}
  };
  const context = {
    window,
    document:{hidden:false,addEventListener(){},getElementById(){return null;},querySelector(){return null;},querySelectorAll(){return[];}},
    localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},
    setTimeout,clearTimeout,Promise,console,Math,Date,JSON,CustomEvent:function(){},fetch(){throw new Error('authenticated fbGet should be used');}
  };
  vm.runInNewContext(fs.readFileSync('snippets/bulk-import-v2.js','utf8'),context);
  assert.equal(typeof listeners['rb:auth-ready'],'function','authentication must trigger cloud hydration');
  listeners['rb:auth-ready']({detail:{name:'View'}});
  await new Promise(resolve=>setTimeout(resolve,20));
  const hydrated=JSON.parse(storage.get('rb_olympplus_v1')||'[]');
  assert.equal(hydrated.length,2428,'a fresh browser with no local cache must receive the complete online tracker immediately after PIN authentication');
  console.log('content-fresh-browser-v1: authenticated cold-start hydration passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
