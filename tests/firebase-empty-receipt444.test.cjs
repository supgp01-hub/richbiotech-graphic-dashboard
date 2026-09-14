const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');const c={window:{},Response};vm.createContext(c);vm.runInContext(fs.readFileSync('snippets/safe-order-write-v1.js','utf8'),c);const a=c.window.rbSafeOrderWrite;
assert(a.matches({id:'A',status:'pending'},{id:'A',status:'pending',empty:[],nested:{x:null}},'PUT'));
assert(a.matches({items:{0:'a',2:'b'}},{items:['a',null,'b']},'PATCH'));
assert(!a.matches({id:'A',brief:'real text'},{id:'A',brief:[]},'PUT'));
assert(!a.matches({assignee:'JAM'},{assignee:'DOM'},'PATCH'));
(async()=>{let writes=0;await a.write('test',{method:'PATCH',body:JSON.stringify({empty:[],status:'pending'}),rbBaseUpdatedAt:1},async(u,o)=>{if(o.method)writes++;return new Response(JSON.stringify({status:'pending',updatedAt:20}),{headers:{ETag:'v2'}});});assert.equal(writes,0);console.log('PASS: Firebase omitted empty nodes reconcile without overwrites; real text and assignee conflicts remain');})().catch(e=>{console.error(e);process.exitCode=1});
