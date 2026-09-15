(function(w){
'use strict';
var DB='https://richbiotech-c4e41-default-rtdb.firebaseio.com',sending=false,lastRetry=0,sentAt=0,sentUid='',device='',openBox=null;
function build(){return (document.querySelector('meta[name="rb-build"]')||{}).content||'unknown';}
function json(k,f){try{return JSON.parse(localStorage.getItem(k)||'null')||f;}catch(e){return f;}}
function pending(){
 var orders=w.rbOrderSync&&w.rbOrderSync.queue?w.rbOrderSync.queue():json('rb_order_write_queue_v1',[]),generic=w.rbPersistence&&w.rbPersistence.queue?w.rbPersistence.queue():json('rb_generic_write_queue_v3',[]);
 if(!Array.isArray(orders))orders=[];if(!Array.isArray(generic))generic=[];
 var content=Number(json('rb_ct_sync_pending_v1',0))>0?1:0,now=Date.now(),at=orders.concat(generic).map(function(o){return Number(o.ts||o.createdAt||0);}).filter(function(t){return t>0&&t<=now;});
 var last=w.rbOnlineConsistency&&w.rbOnlineConsistency.lastRead?w.rbOnlineConsistency.lastRead():0;
 return {orders:orders.length,generic:generic.length,content:content,total:orders.length+generic.length+content,conflicts:orders.filter(function(o){return o.conflict;}).length,oldestAgeMs:at.length?now-Math.min.apply(Math,at):0,lastReadAgeMs:last?Math.max(0,now-last):null,online:navigator.onLine!==false};
}
async function bounded(task){var timer;try{return await Promise.race([task,new Promise(function(_,reject){timer=setTimeout(function(){reject(new Error('อ่านสถานะออนไลน์เกินเวลาที่กำหนด'));},12000);})]);}finally{clearTimeout(timer);}}
async function send(){
 var u=w._rbUser;if(sending||!u||!u.uid||!w.rbFirebaseAuth||navigator.onLine===false||(sentUid===u.uid&&Date.now()-sentAt<60000))return;sending=true;
 var c=new AbortController();try{
  if(!device){try{device=localStorage.getItem('rb_sync_device_v1')||'';if(!device){device='device_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);localStorage.setItem('rb_sync_device_v1',device);}}catch(e){device=device||'session_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);}}
  var report=Object.assign({schema:1,employee:u.name||'',build:build(),checkedAt:{'.sv':'timestamp'}},pending());
  var response=await bounded(w.rbFirebaseAuth.fetch(DB+'/workflow_snapshots/sync_health_v1/'+encodeURIComponent(u.uid)+'/'+encodeURIComponent(device)+'.json',{method:'PUT',signal:c.signal,headers:{'Content-Type':'application/json'},body:JSON.stringify(report)}));if(response.ok){sentUid=u.uid;sentAt=Date.now();}
 }catch(e){}finally{c.abort();sending=false;}
}
function retry(){
 if(!w._rbUser||!w._rbUser.uid||navigator.onLine===false||Date.now()-lastRetry<30000)return;
 var p=pending();if(!p.total&&p.lastReadAgeMs!==null&&p.lastReadAgeMs<60000)return;lastRetry=Date.now();
 // Each queue is independent. Never delete, rewrite or force a conflicting operation.
 try{if(p.orders&&w.rbOrderSync)w.rbOrderSync.flush();}catch(e){}
 try{if(p.generic&&w.rbPersistence)w.rbPersistence.flush();}catch(e){}
 try{if(p.content&&w.ctSyncNow)Promise.resolve(w.ctSyncNow()).catch(function(){});}catch(e){}
 try{if((p.lastReadAgeMs===null||p.lastReadAgeMs>=60000)&&w.fbRefreshOrders)w.fbRefreshOrders();}catch(e){}
}
function indicator(state,text,title){
 if(!['online','saved'].includes(state))return {state:state,text:text,title:title};var p=pending();
 if(p.total)return {state:'waiting',text:'รอซิงก์ '+p.total+' รายการ',title:'งาน '+p.orders+' · ข้อมูลทั่วไป '+p.generic+' · รวมลิงก์ '+p.content+' ยังรอยืนยันออนไลน์'};
 if(!w._rbUser||!w._rbUser.uid||p.lastReadAgeMs===null||p.lastReadAgeMs>90000)return {state:'waiting',text:'รอยืนยันออนไลน์',title:'ยังยืนยันข้อมูลออนไลน์ล่าสุดไม่ได้ ระบบกำลังเชื่อมต่อใหม่'};
 return {state:state,text:text,title:title};
}
function classify(r,now,current){
 if(!r||!r.checkedAt)return 'missing';
 if(now-Number(r.checkedAt)>180000||Number(r.checkedAt)>now+60000)return 'stale';
 if(r.schema!==1)return 'unknown';
 if(r.conflicts>0)return 'conflict';
 if(r.total>0)return 'pending';
 if(r.lastReadAgeMs==null||r.lastReadAgeMs>90000||!r.online)return 'unconfirmed';
 if(!/^fix\d+$/.test(r.build||'')||Number(r.build.slice(3))<Number((current||'fix0').slice(3)))return 'outdated';
 return 'ok';
}
function coverage(users,reports,now,current,legacy){
 var groups={};Object.keys(users||{}).forEach(function(uid){var u=users[uid];if(!u||u.active===false||!u.name)return;var k=String(u.name).trim().toLowerCase();var g=groups[k]||(groups[k]={name:u.name,devices:[]});var devices={};Object.keys(legacy&&legacy[uid]||{}).forEach(function(id){var r=legacy[uid][id];devices[id]=Object.assign({},r,{schema:0,conflicts:r.count});});Object.assign(devices,reports&&reports[uid]||{});Object.values(devices).forEach(function(r){g.devices.push({report:r,state:classify(r,now,current)});});});
 return Object.values(groups).sort(function(a,b){return a.name.localeCompare(b.name);});
}
var labels={missing:'ยังไม่มีรายงานจากเครื่อง',stale:'รายงานเก่า • ยังยืนยันปัจจุบันไม่ได้',unknown:'รายงานไม่ครบ',conflict:'มีข้อมูลขัดกัน • เก็บสำเนาไว้',pending:'มีรายการรอซิงก์',unconfirmed:'ยังยืนยันข้อมูลออนไลน์ล่าสุดไม่ได้',outdated:'ยังใช้เว็บเวอร์ชันเก่า',ok:'ข้อมูลล่าสุด • ไม่มีคิวค้าง'};
async function team(){
 if(!w._rbUser||w._rbUser.role!=='sup')return;
 if(openBox){openBox.close();openBox.remove();}
 var box=document.createElement('dialog');openBox=box;box.style.cssText='margin:auto;padding:24px;border-radius:16px;width:92%;max-width:1000px;max-height:85vh;overflow:auto;background:#fff;color:#173e47';
 var h=document.createElement('h2');h.textContent='สถานะซิงก์ทั้งทีม';box.appendChild(h);var refresh=document.createElement('button');refresh.textContent='ตรวจสถานะล่าสุด';box.appendChild(refresh);var close=document.createElement('button');close.textContent='ปิดสถานะทีม';close.onclick=function(){box.close();box.remove();openBox=null;};box.appendChild(close);var body=document.createElement('div');box.appendChild(body);document.body.appendChild(box);box.showModal();
 async function load(){if(!w._rbUser||w._rbUser.role!=='sup')return;refresh.disabled=true;body.textContent='กำลังตรวจรายชื่อผู้ใช้และรายงานจากทุกเครื่อง…';try{
  var result=await bounded(Promise.all([w.rbFirebaseAuth.db('auth_users'),w.rbFirebaseAuth.db('workflow_snapshots/sync_health_v1'),w.rbFirebaseAuth.db('workflow_snapshots/order_sync_diagnostics_v1')]));if(!box.isConnected)return;
  var rows=coverage(result[0],result[1],Date.now(),build(),result[2]);body.textContent='รายงานอัตโนมัติขณะเปิดเว็บ • รายงานเกิน 3 นาทีจะไม่ถือว่ายืนยันแล้ว • ไม่มีรายงานไม่ได้แปลว่าไม่มีงานค้าง';
  rows.forEach(function(g){var section=document.createElement('section');section.style.cssText='padding:12px 0;border-bottom:1px solid #d3e4dc';var name=document.createElement('h3');name.textContent=g.name;section.appendChild(name);
   if(!g.devices.length){var p=document.createElement('p');p.textContent=labels.missing+' • เปิดเว็บล่าสุดจากเครื่องที่ใช้งานเดิม';section.appendChild(p);}
   g.devices.sort(function(a,b){return Number(b.report.checkedAt||0)-Number(a.report.checkedAt||0);}).forEach(function(d){var r=d.report,p=document.createElement('p');p.textContent=labels[d.state]+' · '+(r.build==='fix446'?'ไม่ทราบเวอร์ชันจริง':r.build)+' · '+(r.schema===1?'งาน '+Number(r.orders||0)+' / ข้อมูลทั่วไป '+Number(r.generic||0)+' / รวมลิงก์ '+Number(r.content||0):'ยังไม่มีรายงานคิวครบทุกระบบ')+' · ขัดกัน '+Number(r.conflicts||0)+' · '+new Date(r.checkedAt).toLocaleString('th-TH');section.appendChild(p);});body.appendChild(section);
  });
 }catch(e){body.textContent='ตรวจสถานะไม่สำเร็จ ยังยืนยันว่าทุกเครื่องซิงก์ครบไม่ได้: '+e.message;}finally{refresh.disabled=false;}}
 refresh.onclick=load;load();
}
function tick(){if(document.hidden)return;retry();send();}
document.addEventListener('click',function(e){if(e.target.closest('[data-sync-team]'))team();});
w.addEventListener('online',tick);w.addEventListener('focus',tick);setTimeout(tick,5000);setInterval(tick,60000);
w.rbSyncWatchdog={pending:pending,classify:classify,coverage:coverage,send:send,retry:retry,team:team,indicator:indicator};
})(window);
