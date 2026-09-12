const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const ns='demo-safe-orders',base='http://127.0.0.1:19000';
function token(uid){const enc=x=>Buffer.from(JSON.stringify(x)).toString('base64url');return enc({alg:'none',typ:'JWT'})+'.'+enc({sub:uid,user_id:uid,iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+3600,aud:ns,iss:'https://securetoken.google.com/'+ns,firebase:{sign_in_provider:'custom'}})+'.';}
function req(path,data,who='owner',method='PUT',headers={}){return fetch(base+'/'+path+'.json?ns='+ns+(who==='owner'?'':'&auth='+token(who)),{method,headers:{'Content-Type':'application/json',...(who==='owner'?{Authorization:'Bearer owner'}:{}),...headers},...(data===undefined?{}:{body:JSON.stringify(data)})});}
const ctx={window:{},Response};vm.createContext(ctx);vm.runInContext(fs.readFileSync('snippets/safe-order-write-v1.js','utf8'),ctx);
(async()=>{
let r=await req('.settings/rules',JSON.parse(fs.readFileSync('database.rules.json','utf8')));assert(r.ok,await r.text());
await req('auth_users',{staff:{name:'TER',active:true,role:'graphic'},sup:{name:'VIEW',active:true,role:'sup'}});
await req('orders/test',{id:'test',assignee:'TER',status:'pending',updatedAt:10});
const url=base+'/orders/test.json?ns='+ns+'&auth='+token('staff'),transport=(u,o)=>fetch(u,o);
r=await ctx.window.rbSafeOrderWrite.write(url,{method:'PATCH',body:JSON.stringify({status:'review',updatedAt:20,submitLink:'https://example.com/work'}),rbBaseUpdatedAt:10,rbWriteToken:'op1'},transport);assert(r.ok,await r.text());
// Retry after a lost acknowledgement must not duplicate or reject the committed submission.
r=await ctx.window.rbSafeOrderWrite.write(url,{method:'PATCH',body:JSON.stringify({status:'review',updatedAt:20}),rbBaseUpdatedAt:10,rbWriteToken:'op1'},transport);assert(r.ok);
await assert.rejects(()=>ctx.window.rbSafeOrderWrite.write(url,{method:'PATCH',body:JSON.stringify({status:'pending',updatedAt:30}),rbBaseUpdatedAt:10},transport));
r=await req('orders/test',{status:'pending',updatedAt:11},'staff','PATCH');assert(!r.ok,'old clients must be denied by server');
// Two concurrent editors get the same ETag: only one conditional commit succeeds.
const read=await fetch(url,{headers:{'X-Firebase-ETag':'true'}}),data=await read.json(),etag=read.headers.get('ETag');const results=await Promise.all(['done','revision'].map(status=>fetch(url,{method:'PUT',headers:{'Content-Type':'application/json','if-match':etag},body:JSON.stringify({...data,status,updatedAt:30,_syncRevision:2})})));assert.equal(results.filter(r=>r.ok).length,1);assert(results.some(r=>r.status===412));
r=await req('orders/test',undefined,'staff','DELETE');assert(!r.ok,'physical deletion cannot bypass history');
const fresh=await (await fetch(url)).json();r=await ctx.window.rbSafeOrderWrite.write(url,{method:'PUT',body:JSON.stringify({id:'test',_deleted:true,updatedAt:40}),rbBaseUpdatedAt:30,rbWriteToken:'delete1'},transport);assert(r.ok,await r.text());
console.log('PASS emulator: normal submit, acknowledgement retry, stale editor, old client blocked, concurrent write rejected, deletion guard');
})().catch(e=>{console.error(e);process.exitCode=1});
