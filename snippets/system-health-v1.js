(function(root){
'use strict';
if(root._rbSystemHealthLoaded)return;root._rbSystemHealthLoaded=true;
var VERSION='1.0.0',lastState={state:'connecting',text:'กำลังเชื่อมต่อ...',title:''},opened=false,timer=null;
function n(value){value=Number(value);return isFinite(value)&&value>0?value:0;}
function local(key){try{return localStorage.getItem(key);}catch(error){return null;}}
function json(key,fallback){try{var value=JSON.parse(local(key)||'null');return value==null?fallback:value;}catch(error){return fallback;}}
function countOrderQueue(){var q=json('rb_order_write_queue_v1',[]);return Array.isArray(q)?q.length:0;}
function countGenericQueue(){if(root.rbPersistence&&typeof root.rbPersistence.pendingCount==='function')return root.rbPersistence.pendingCount();var q=json('rb_generic_write_queue_v3',[]);return Array.isArray(q)?q.length:0;}
function contentPending(){return !!local('rb_ct_sync_pending_v1');}
function latestSuccess(){return n(local('rb_system_last_sync_ok_v1'));}
function pendingRows(){
  var rows=[],order=json('rb_order_write_queue_v1',[]),generic=json('rb_generic_write_queue_v3',[]);
  (Array.isArray(order)?order:[]).slice(0,4).forEach(function(item){var key=String(item&&item.path||'').split('/').pop()||'งาน';rows.push({name:key,action:item&&item.method==='DELETE'?'ลบ':'บันทึกงาน',attempts:n(item&&item.attempts),at:n(item&&item.ts)});});
  (Array.isArray(generic)?generic:[]).slice(0,4).forEach(function(item){rows.push({name:String(item&&item.path||'ข้อมูลทั่วไป').replace(/^\//,''),action:'บันทึกข้อมูล',attempts:n(item&&item.attempts),at:n(item&&item.ts)});});
  if(contentPending())rows.push({name:'รวมลิงก์ Content',action:'ซิงก์รายการ',attempts:0,at:n(local('rb_ct_sync_pending_v1'))});
  return rows.slice(0,6);
}
function fmt(value){if(!value)return 'ยังไม่มีข้อมูล';try{return new Date(value).toLocaleString('th-TH',{dateStyle:'short',timeStyle:'medium'});}catch(error){return new Date(value).toLocaleString('th-TH');}}
function snapshot(){
  var order=countOrderQueue(),generic=countGenericQueue(),content=contentPending()?1:0,total=order+generic+content;
  var online=typeof navigator==='undefined'||navigator.onLine!==false,auth=!!(root.rbFirebaseAuth&&root.rbFirebaseAuth.fetch),leader=!root.rbMultiTab||root.rbMultiTab.isLeader();
  return{online:online,auth:auth,leader:leader,order:order,generic:generic,content:content,total:total,last:latestSuccess(),state:lastState.state,text:lastState.text,title:lastState.title,pending:pendingRows()};
}
function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function ensure(){
  var overlay=document.getElementById('rb-health-overlay');if(overlay)return overlay;
  overlay=document.createElement('div');overlay.id='rb-health-overlay';overlay.className='rb-health-overlay';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','rb-health-title');
  overlay.innerHTML='<section class="rb-health-card"><header class="rb-health-head"><span class="rb-health-icon">⌁</span><div><div class="rb-health-title" id="rb-health-title">สถานะระบบออนไลน์</div><div class="rb-health-sub">ตรวจการเชื่อมต่อและรายการที่กำลังรอบันทึก</div></div><button type="button" class="rb-health-close" aria-label="ปิด">×</button></header><div class="rb-health-body"><div id="rb-health-content"></div><div class="rb-health-actions"><button type="button" class="rb-health-btn" data-rb-health-close>ปิด</button><button type="button" class="rb-health-btn primary" id="rb-health-retry">ตรวจและซิงก์อีกครั้ง</button></div></div></section>';
  overlay.addEventListener('click',function(event){if(event.target===overlay||event.target.closest('.rb-health-close,[data-rb-health-close]'))close();});
  var retry=overlay.querySelector('#rb-health-retry');retry.addEventListener('click',function(){retry.disabled=true;retry.textContent='กำลังตรวจสอบ...';retryAll().then(function(){setTimeout(function(){retry.disabled=false;retry.textContent='ตรวจและซิงก์อีกครั้ง';render();},700);});});
  document.body.appendChild(overlay);return overlay;
}
function render(){
  var host=document.getElementById('rb-health-content');if(!host)return;var s=snapshot(),kind=!s.online||s.state==='error'?'error':s.total||s.state==='waiting'?'waiting':'ok';
  var summary=!s.online?'อินเทอร์เน็ตขาดการเชื่อมต่อ — งานใหม่จะเก็บไว้ในเครื่องก่อน':s.total?'มี '+s.total+' รายการกำลังรอซิงก์ ระบบจะลองใหม่อัตโนมัติ':'ระบบออนไลน์และข้อมูลพร้อมใช้งาน';
  host.innerHTML='<div class="rb-health-summary '+(kind==='ok'?'':kind)+'"><span class="rb-health-dot"></span><span>'+esc(summary)+'</span></div><div class="rb-health-grid">'+
    '<div class="rb-health-item"><div class="rb-health-label">การเชื่อมต่อ</div><div class="rb-health-value">'+(s.online?'ออนไลน์':'ออฟไลน์')+'</div><div class="rb-health-meta">'+esc(s.title||s.text||'พร้อมใช้งาน')+'</div></div>'+
    '<div class="rb-health-item"><div class="rb-health-label">บัญชีและฐานข้อมูล</div><div class="rb-health-value">'+(s.auth?'พร้อมใช้งาน':'กำลังเชื่อมต่อ')+'</div><div class="rb-health-meta">'+(s.leader?'แท็บนี้ดูแลการซิงก์':'ซิงก์ผ่านแท็บหลัก เพื่อลดความช้า')+'</div></div>'+
    '<div class="rb-health-item"><div class="rb-health-label">รายการรอบันทึก</div><div class="rb-health-value">'+s.total+' รายการ</div><div class="rb-health-meta">งาน '+s.order+' · ข้อมูลทั่วไป '+s.generic+' · รวมลิงก์ '+s.content+'</div></div>'+
    '<div class="rb-health-item"><div class="rb-health-label">บันทึกออนไลน์ล่าสุด</div><div class="rb-health-value">'+(s.last?fmt(s.last):'กำลังตรวจสอบ')+'</div><div class="rb-health-meta">ข้อมูลในเครื่องยังคงใช้ทำงานได้ระหว่างรอ</div></div></div>'+
    (s.pending.length?'<div class="rb-health-pending"><div class="rb-health-pending-title">รายละเอียดรายการที่รอ</div>'+s.pending.map(function(row){return '<div class="rb-health-pending-row"><div><strong>'+esc(row.name)+'</strong>'+esc(row.action)+'</div><span>'+esc(row.at?fmt(row.at):'รอดำเนินการ')+(row.attempts?' · ลองแล้ว '+row.attempts+' ครั้ง':'')+'</span></div>';}).join('')+'</div>':'')+
    '<div class="rb-health-queue"><strong>ระบบป้องกันงานสะดุด</strong><br>เมื่ออินเทอร์เน็ตช้าหรือหลุด ปุ่มงานจะบันทึกลงคิวในเครื่องก่อน แล้วส่งออนไลน์ตามลำดับโดยอัตโนมัติ การเปิดหลายแท็บจะมีเพียงแท็บหลักที่ดึงข้อมูลเพื่อลดการค้าง</div>';
}
function retryAll(){
  var tasks=[];
  try{if(root.rbMultiTab)root.rbMultiTab.claim();}catch(error){}
  try{if(root.rbPersistence&&typeof root.rbPersistence.flush==='function')root.rbPersistence.flush();}catch(error){}
  try{if(root.rbOrderSync&&typeof root.rbOrderSync.flush==='function')root.rbOrderSync.flush();}catch(error){}
  try{if(contentPending()&&typeof root.ctSyncNow==='function')tasks.push(Promise.resolve(root.ctSyncNow()));}catch(error){}
  try{if(typeof root.fbRefreshOrders==='function')tasks.push(new Promise(function(resolve){root.fbRefreshOrders(function(){resolve();});}));}catch(error){}
  return Promise.allSettled(tasks).then(function(){return true;});
}
function open(){opened=true;var overlay=ensure();overlay.classList.add('is-open');render();clearInterval(timer);timer=setInterval(render,1000);var closeButton=overlay.querySelector('.rb-health-close');if(closeButton)closeButton.focus();}
function close(){opened=false;clearInterval(timer);timer=null;var overlay=document.getElementById('rb-health-overlay');if(overlay)overlay.classList.remove('is-open');var chip=document.getElementById('rb-sync-chip');if(chip)chip.focus();}
function wireChip(){var chip=document.getElementById('rb-sync-chip');if(!chip||chip.getAttribute('data-health-wired'))return;chip.setAttribute('data-health-wired','1');chip.setAttribute('role','button');chip.setAttribute('tabindex','0');chip.setAttribute('aria-label','เปิดสถานะระบบออนไลน์');chip.addEventListener('click',open);chip.addEventListener('keydown',function(event){if(event.key==='Enter'||event.key===' '){event.preventDefault();open();}});}
root.addEventListener('rb:sync-state',function(event){lastState=event.detail||lastState;wireChip();if(opened)render();});
root.addEventListener('rb:persistence-state',function(){if(opened)render();});root.addEventListener('online',function(){if(opened)render();});root.addEventListener('offline',function(){if(opened)render();});
document.addEventListener('keydown',function(event){if(event.key==='Escape'&&opened)close();});
root.rbSystemHealth={version:VERSION,open:open,close:close,snapshot:snapshot,retry:retryAll};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wireChip);else wireChip();setTimeout(wireChip,500);
document.documentElement.setAttribute('data-system-health',VERSION);
})(window);
