const fs=require('fs'),path=require('path'),{spawn}=require('child_process');
const root=path.resolve(__dirname,'..'),files=fs.readdirSync(__dirname).filter(f=>/\.test\.(c?js)$/.test(f)).sort();
const results=[];let cursor=0;
async function worker(){while(cursor<files.length){const file=files[cursor++],start=Date.now();await new Promise(resolve=>{
 const child=spawn(process.execPath,['--require',path.join(__dirname,'no-network.cjs'),path.join(__dirname,file)],{cwd:root,env:process.env,windowsHide:true});let output='',timedOut=false;
 const timer=setTimeout(()=>{timedOut=true;child.kill();},60000);
 child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);
 child.on('error',e=>output+=e.stack);child.on('close',code=>{clearTimeout(timer);const ok=code===0&&!timedOut;results.push({file,ok,code,timedOut,ms:Date.now()-start,output});console.log((ok?'PASS ':'FAIL ')+file);resolve();});
 });}}
Promise.all(Array.from({length:4},worker)).then(()=>{results.sort((a,b)=>a.file.localeCompare(b.file));const report={timestamp:new Date().toISOString(),network:'disabled',passed:results.filter(r=>r.ok).length,total:results.length,results};const out=process.argv[2];if(out)fs.writeFileSync(path.resolve(out),JSON.stringify(report,null,2));console.log(`${report.passed}/${report.total} regression scripts passed`);if(report.passed!==report.total)process.exitCode=1;});
