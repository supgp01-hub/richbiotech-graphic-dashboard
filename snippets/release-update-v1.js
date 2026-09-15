(function(w){
'use strict';
var meta=document.querySelector('meta[name="rb-build"]'),current=meta&&meta.content||'',latest='',busy=false,reloading=false,dirty=new Set(),banner,safeQueue='';
function newer(a,b){return /^fix\d+$/.test(a)&&/^fix\d+$/.test(b)&&Number(a.slice(3))>Number(b.slice(3));}
function visible(el){return el&&!el.hidden&&el.getClientRects().length>0;}
function blocked(){
 if(w.rbOrderSync&&w.rbOrderSync.pendingCount()&&(!safeQueue||!w.rbOrderSync.queue||JSON.stringify(w.rbOrderSync.queue())!==safeQueue))return true;
 for(var key of ['rb_generic_write_queue_v3']){try{if(JSON.parse(localStorage.getItem(key)||'[]').length)return true;}catch(e){return true;}}
 if(Array.from(document.querySelectorAll('dialog[open],#rb-order-modal,#rb-planner-modal,[role="dialog"],input[type="file"]')).some(function(el){return visible(el)&&(el.type!=='file'||el.files&&el.files.length);}))return true;
 return Array.from(dirty).some(function(el){return el.isConnected&&visible(el);});
}
function show(){
 if(!banner){banner=document.createElement('div');banner.id='rb-release-update';banner.setAttribute('role','status');banner.style.cssText='position:fixed;bottom:16px;left:16px;right:16px;z-index:120000;background:#164b3c;color:white;padding:12px 18px;border-radius:12px;box-shadow:0 3px 18px #0003';document.body.appendChild(banner);}
 banner.textContent='มีเว็บเวอร์ชัน '+latest+' • กรุณาบันทึกข้อมูลและปิดแบบฟอร์ม ระบบจะอัปเดตเมื่อไม่มีงานรอซิงก์';
}
function update(){
 if(!newer(latest,current)||reloading)return;
 if(blocked()){show();return;}
 try{var attempt=JSON.parse(sessionStorage.getItem('rb_release_attempt_v1')||'null');if(attempt&&attempt.target===latest&&attempt.from===current&&(attempt.count>=3||Date.now()-attempt.at<60000)){show();banner.textContent='พบเว็บเวอร์ชัน '+latest+' แต่ยังโหลดไม่ครบ ระบบเก็บหน้านี้ไว้เพื่อไม่ให้รีโหลดวน';return;}sessionStorage.setItem('rb_release_attempt_v1',JSON.stringify({target:latest,from:current,at:Date.now(),count:attempt&&attempt.target===latest&&attempt.from===current?attempt.count+1:1}));}catch(e){show();return;}
 reloading=true;var url=new URL(location.href);url.searchParams.set('__rb_release',latest);location.replace(url.toString());
}
async function check(){
 if(busy||navigator.onLine===false||document.hidden)return;busy=true;
 try{var url=new URL('release.json',location.href);url.searchParams.set('_check',Date.now());var r=await fetch(url.toString(),{cache:'no-store'});if(!r.ok)return;var v=await r.json();if(newer(v.build,current)){latest=v.build;var sync=w.rbOrderSync,q=sync&&sync.queue&&sync.queue();if(q&&q.length&&q.every(function(op){return op.conflict;})&&sync.checkpoint){var signature=JSON.stringify(q);if(await sync.checkpoint())safeQueue=signature;}update();}}catch(e){}finally{busy=false;}
}
function edited(e){if(e.target.matches('textarea,select,input:not([type="search"])')&&!e.target.matches('#ord-fst,#ord-type-filter,#ord-sort')&&!e.target.closest('[role="search"],.rb-ord-toolbar'))dirty.add(e.target);}
document.addEventListener('input',edited,true);document.addEventListener('change',edited,true);
// Closing the edited form permits an update. An unrelated online receipt
// must never clear another form's unsaved input.
w.addEventListener('online',check);w.addEventListener('focus',check);
document.addEventListener('visibilitychange',function(){if(!document.hidden)check();});
setTimeout(check,10000);setInterval(check,60000);setInterval(update,5000);
w.rbReleaseUpdate={check:check,newer:newer,blocked:blocked,current:current};
})(window);
