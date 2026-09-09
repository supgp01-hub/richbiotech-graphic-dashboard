// Run only against the local Firebase Database Emulator on port 19000.
const assert=require('node:assert/strict'),fs=require('node:fs');
const base='http://127.0.0.1:19000',ns='demo-content-rules';
function token(uid){const enc=x=>Buffer.from(JSON.stringify(x)).toString('base64url');return enc({alg:'none',typ:'JWT'})+'.'+enc({sub:uid,user_id:uid,iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+3600,aud:ns,iss:'https://securetoken.google.com/'+ns,firebase:{sign_in_provider:'custom'}})+'.';}
async function req(path,who,method='GET',data){return fetch(base+'/'+path+'.json?ns='+ns+(who&&who!=='owner'?'&auth='+encodeURIComponent(token(who)):''),{method,headers:{'Content-Type':'application/json',...(who==='owner'?{Authorization:'Bearer owner'}:{})},...(data!==undefined?{body:JSON.stringify(data)}:{})});}
async function expect(path,who,method,data,ok){const r=await req(path,who,method,data);assert.equal(r.ok,ok,`${who||'anonymous'} ${method} ${path}: ${r.status} ${await r.text()}`);}
(async()=>{
 let r=await req('.settings/rules','owner','PUT',JSON.parse(fs.readFileSync('database.rules.json','utf8')));assert.equal(r.ok,true,await r.text());
 await expect('auth_users','owner','PUT',{staff:{name:'NUNE',active:true,role:'graphic'},other:{name:'JAM',active:true,role:'graphic'},sup:{name:'VIEW',active:true,role:'sup'},audit:{name:'NUI',active:true,role:'audit'},spec:{name:'MOS',active:true,role:'spec'},disabled:{name:'OFF',active:false,role:'sup'}},true);
 const path='content_submissions_v1/staff/row1',record={rowId:'row1',ownerUid:'staff',ownerName:'NUNE',text:'ข้อความ\nบรรทัดสอง',updatedAt:{'.sv':'timestamp'}};
 await expect(path,'staff','PUT',record,true);
 for(const who of ['staff','sup','audit'])await expect(path,who,'GET',undefined,true);
 for(const who of [null,'other','spec','disabled'])await expect(path,who,'GET',undefined,false);
 await expect('content_submissions_v1','staff','GET',undefined,false);
 await expect('content_submissions_v1','sup','GET',undefined,true);
 await expect('content_submissions_v1','audit','GET',undefined,true);
 await expect('content_submissions_v1/staff','staff','GET',undefined,true);
 for(const who of ['other','sup','audit','disabled'])await expect(path,who,'PUT',record,false);
 for(const edit of [{ownerUid:'other'},{ownerName:'VIEW'},{rowId:'different'},{text:''},{text:'x'.repeat(10001)},{updatedAt:1},{extra:'not allowed'}])await expect(path,'staff','PUT',{...record,...edit},false);
 await expect(path,'staff','DELETE',undefined,false);
 const cat='content_product_catalog_v1/product',product={name:'สินค้าใหม่',owners:'NUNE JAM',updatedAt:{'.sv':'timestamp'}};
 await expect(cat,'sup','PUT',product,true);
 for(const who of ['staff','audit','spec']){await expect(cat,who,'GET',undefined,true);await expect(cat,who,'PUT',product,false);}
 await expect(cat,'disabled','GET',undefined,false);
 await expect(cat,'sup','PUT',{...product,name:'renamed'},false);
 console.log('PASS: emulator enforces owner-only texts, Supervisor/Audit reads, validation, and Supervisor-only catalog writes');
})().catch(e=>{console.error(e);process.exitCode=1});
