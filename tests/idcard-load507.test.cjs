const {JSDOM}=require('jsdom'),fs=require('fs'),assert=require('node:assert/strict');
(async()=>{
 const dom=new JSDOM('<body></body>',{url:'http://localhost',runScripts:'outside-only'}),w=dom.window;
 const rows=Object.fromEntries(Array.from({length:242},(_,i)=>['card'+i,{id:'card'+i,updatedAt:2,photo:{data:'data:image/png;base64,AAAA'}}]));
 let legacy=JSON.parse(JSON.stringify(rows)),writes=[];
 w._rbUser={role:'sup'};w.fbGet=(path,cb)=>cb(null,path==='/idcards'?legacy:rows);
 w.fbSet=async(path,value)=>{writes.push(path);return true;};
 w.eval(fs.readFileSync('snippets/idcard-save-reliability-v1.js','utf8'));w.rbIdcardReliability.installCloudTracker();w.rbIdcardReliability.installCloudReader();
 const read=()=>new Promise((resolve,reject)=>w.fbGet('/idcards',(e,data)=>e?reject(e):resolve(data)));
 assert.equal((await read()).length,242);assert.deepEqual(writes,[],'opening 242 already shared photos must not upload them again');
 legacy.extra={id:'extra',updatedAt:3,photo:{data:'preserve'}};
 assert.equal((await read()).length,243);assert.deepEqual(writes,['/workflow_snapshots/idcards_shared_v1/extra'],'migrate only missing legacy row');
 rows.extra=legacy.extra;writes=[];await read();assert.deepEqual(writes,[],'repeat read stays write-free');
 legacy.card0={...legacy.card0,updatedAt:4,phase:'newer'};await read();assert.deepEqual(writes,['/workflow_snapshots/idcards_shared_v1/card0'],'newer legacy changes still migrate');
 dom.window.close();console.log('PASS 242 shared photos are not reuploaded; missing and newer legacy records preserved');
})().catch(e=>{console.error(e);process.exitCode=1});