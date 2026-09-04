const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

(async()=>{
  const storage = new Map([['rb_olympplus_v1',JSON.stringify([{id:'old-1',brand:'So Pink'}])]]);
  const remoteRows = Array.from({length:2428},(_,i)=>({id:`cloud-${i}`,brand:i?'Olymplus':'Liv CARE'}));
  const window = {__CT_IMPORT_TEST__:true,addEventListener(){},dispatchEvent(){}};
  const context = {
    window,
    document:{hidden:false,addEventListener(){},getElementById(){return null;},querySelector(){return null;},querySelectorAll(){return[];}},
    localStorage:{
      getItem:key=>storage.get(key)||null,
      setItem(key,value){if(key==='rb_olympplus_v1'&&JSON.parse(value).length>100)throw new Error('QuotaExceededError');storage.set(key,value);},
      removeItem:key=>storage.delete(key)
    },
    setTimeout,clearTimeout,Promise,console,Math,Date,JSON,CustomEvent:function(){},fetch(){throw new Error('not used');}
  };
  vm.runInNewContext(fs.readFileSync('snippets/bulk-import-v2.js','utf8'),context);
  context.window._ctApplyCloudForTest({items:remoteRows,source:'verified-online'});
  assert.equal(JSON.parse(storage.get('rb_olympplus_v1')).length,1,'the old cache demonstrates the browser quota failure');
  assert.equal(window._ctCloudRows.length,2428,'the complete Firebase snapshot must still be rendered from memory');
  assert.equal(window._ctCloudRows[0].brand,'Liv CARE');
  assert.equal(window._ctCloudVerified,true);
  console.log('content-quota-fallback-v1: large online dataset survives localStorage quota exhaustion');
})().catch(error=>{console.error(error);process.exitCode=1;});
