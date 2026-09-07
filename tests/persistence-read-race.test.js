const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const store = new Map(), reads = [];
const localStorage = {getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
const document = {getElementById:()=>null,documentElement:{setAttribute(){}}};
const window = {localStorage,document,addEventListener(){},dispatchEvent(){},
  fbSet:()=>Promise.resolve(true),fbGet:(path,cb)=>reads.push(cb)};
vm.runInNewContext(fs.readFileSync('snippets/persistence-reliability-v3.js','utf8'),
  {window,document,localStorage,navigator:{onLine:true},CustomEvent:function(){},setTimeout(){},clearTimeout(){},console});
const tick=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
  let result;
  window.fbGet('/items',(error,data)=>{assert.ifError(error);result=data;});
  await window.fbSet('/items/a',{note:'new'});
  await tick();
  assert.equal(window.rbPersistence.pendingCount(),0);
  reads.shift()(null,{a:{note:'old'},b:{note:'keep'}});
  assert.equal(result.a.note,'new','a slow GET must not undo a write acknowledged while that GET was in flight');
  assert.equal(result.b.note,'keep');
  window.fbGet('/items',(error,data)=>{assert.ifError(error);result=data;});
  reads.shift()(null,{a:{note:'changed by colleague'}});
  assert.equal(result.a.note,'changed by colleague','later reads must still accept remote changes');
  window.fbGet('/items',(error,data)=>{assert.ifError(error);result=data;});
  await window.fbSet('/items/a',null);await tick();
  reads.shift()(null,{a:{note:'deleted'}});
  assert.equal(result.a,undefined,'an in-flight snapshot must not resurrect an acknowledged deletion');
  let readError;
  window.fbGet('/items',error=>{readError=error;});
  await window.fbSet('/items/a',{note:'new'});
  reads.shift()(new Error('offline'),null);
  assert.ok(readError,'partial local writes must not turn a failed collection read into a successful incomplete snapshot');
  console.log('persistence read races passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
