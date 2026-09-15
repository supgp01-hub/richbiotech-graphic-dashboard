(function(w){
'use strict';
var meta=document.querySelector('meta[name="rb-build"]'),current=meta&&meta.content||'',latest='',busy=false,verifying=false,reloading=false,dirty=new Set(),banner,safeQueue='',readyAt=0,lastEdit=0,retryAt=0;
function newer(a,b){return /^fix\d+$/.test(a)&&/^fix\d+$/.test(b)&&Number(a.slice(3))>Number(b.slice(3));}
function visible(el){return el&&!el.hidden&&el.getClientRects().length>0;}
function blocked(){
 if(navigator.onLine===false)return true;
 try{
  var sync=w.rbOrderSync,q=sync&&sync.queue?sync.queue():JSON.parse(localStorage.getItem('rb_order_write_queue_v1')||'[]');
  if((sync&&sync.pendingCount?sync.pendingCount():q.length)&&(!safeQueue||!q||JSON.stringify(q)!==safeQueue))return true;
  if(w.rbPersistence&&w.rbPersistence.pendingCount&&w.rbPersistence.pendingCount())return true;
  if(JSON.parse(localStorage.getItem('rb_generic_write_queue_v3')||'[]').length||localStorage.getItem('rb_ct_sync_pending_v1'))return true;
  if(w.ctSubmissions&&w.ctSubmissions.pendingCount&&w.ctSubmissions.pendingCount())return true;
  if(w.ctPendingCount&&w.ctPendingCount())return true;
 }catch(e){return true;}
 if(Array.from(document.querySelectorAll('dialog[open],#rb-order-modal,#rb-planner-modal,[role="dialog"],input[type="file"],[data-busy="1"],[data-dirty="1"]')).some(function(el){return visible(el)&&(el.type!=='file'||el.files&&el.files.length);}))return true;
 // Hidden panels can still contain drafts. Only their own save acknowledgement
 // or removal/discard of the form releases the guard.
 dirty.forEach(function(el){var form=el.closest('#rb-order-modal,#rb-order-planner');if(!el.isConnected||(form&&!visible(form)))dirty.delete(el);});
 return dirty.size>0;
}
function show(text){
 if(!banner){banner=document.createElement('div');banner.id='rb-release-update';banner.setAttribute('role','status');banner.style.cssText='position:fixed;bottom:16px;left:16px;right:16px;z-index:120000;background:#164b3c;color:white;padding:12px 18px;border-radius:12px;box-shadow:0 3px 18px #0003';document.body.appendChild(banner);}
 banner.textContent=text||'มีเว็บเวอร์ชัน '+latest+' • ระบบจะรีเฟรชอัตโนมัติหลังบันทึกข้อมูล ซิงก์สำเร็จ และปิดแบบฟอร์ม';
}
async function request(url,type){var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},15000);try{var r=await fetch(url.toString(),{cache:'no-store',signal:controller.signal});if(!r.ok)throw Error('release unavailable');return await r[type]();}finally{clearTimeout(timer);}}
async function update(){
 if(!newer(latest,current)||reloading||verifying)return;
 if(blocked()){readyAt=0;show();return;}
 // Recheck after both the quiet period and network probe: edits must survive.
 if(!readyAt){readyAt=Date.now();show('มีเวอร์ชัน '+latest+' • กำลังเตรียมรีเฟรชอัตโนมัติ');return;}
 if(Date.now()-Math.max(readyAt,lastEdit)<3000||Date.now()<retryAt)return;
 verifying=true;
 try{
  var target=latest,url=new URL(location.href);url.searchParams.set('__rb_release',target);
  var probe=new URL(url);probe.searchParams.set('_rb_probe',Date.now());
  var html=await request(probe,'text'),doc=new DOMParser().parseFromString(html,'text/html'),found=doc.querySelector('meta[name="rb-build"]');
  if(!found||found.content!==target){retryAt=Date.now()+30000;show('กำลังรอไฟล์เวอร์ชัน '+target+' ให้พร้อม ระบบจะลองใหม่อัตโนมัติ');return;}
  if(target!==latest||blocked()||Date.now()-lastEdit<3000){readyAt=0;return;}
  var attempt=JSON.parse(sessionStorage.getItem('rb_release_attempt_v1')||'null');
  if(attempt&&attempt.target===target&&attempt.from===current&&Date.now()-attempt.at<60000){retryAt=attempt.at+60000;show('กำลังตรวจเวอร์ชันใหม่อีกครั้ง เพื่อป้องกันการรีเฟรชวน');return;}
  sessionStorage.setItem('rb_release_attempt_v1',JSON.stringify({target:target,from:current,at:Date.now()}));
  reloading=true;location.replace(url.toString());
 }catch(e){retryAt=Date.now()+30000;show('ยังตรวจเวอร์ชันใหม่ไม่สำเร็จ ระบบจะลองใหม่อัตโนมัติ');}finally{verifying=false;}
}
async function check(){
 if(busy||navigator.onLine===false)return;busy=true;
 try{var url=new URL('release.json',location.href);url.searchParams.set('_check',Date.now());var v=await request(url,'json');if(newer(v.build,current)){
  if(latest!==v.build){latest=v.build;readyAt=0;retryAt=0;}
  var sync=w.rbOrderSync,q=sync&&sync.queue&&sync.queue();
  // Existing recovery can checkpoint an unchanged conflict queue online.
  // Never drop the queue or overwrite server data just to update the client.
  if(q&&q.length&&q.every(function(op){return op.conflict;})&&sync.checkpoint){var signature=JSON.stringify(q);if(await sync.checkpoint())safeQueue=signature;}
  await update();
 }}catch(e){}finally{busy=false;}
}
function edited(e){var el=e.target;if(!el.matches||!el.matches('textarea,select,input:not([type="search"]),[contenteditable="true"]'))return;
 if(/(?:search|filter|sort|pager|page-size)/i.test(el.id+' '+el.name)||el.matches('#ord-fst')||el.closest('[role="search"],.rb-ord-toolbar'))return;
 dirty.add(el);lastEdit=Date.now();readyAt=0;
}
function confirmSaved(el,value){if(el&&String(el.value)===String(value)){dirty.delete(el);readyAt=0;}}
document.addEventListener('input',edited,true);document.addEventListener('change',edited,true);
w.addEventListener('online',function(){retryAt=0;check();});w.addEventListener('focus',check);
document.addEventListener('visibilitychange',function(){if(!document.hidden)check();});
// Poll independently on every open device, including background tabs.
// Suspended browsers resume on focus, visibility or reconnection.
setTimeout(check,10000);setInterval(check,30000);setInterval(update,1000);
w.rbReleaseUpdate={check:check,newer:newer,blocked:blocked,confirmSaved:confirmSaved,current:current};
})(window);
