(function(w){
'use strict';
var cacheFields=['_fbKey','_assetsLoaded','_assetsChanged','_rbCacheCompacted','_rbReviewSubmit'];
var serverFields=['updatedAt','_version','_updatedBy','_syncRevision','_lastWriteToken'];
var confirmed={},lastRead=0;
var archived={},archiving={},archiveChain=Promise.resolve(),backedUp={},backupBusy=false;
function equal(a,b){return w.rbSafeOrderWrite.equal(a,b);}
function clientField(k){return cacheFields.indexOf(k)>=0;}
function diff(old,row){
 var out={};Array.from(new Set(Object.keys(old||{}).concat(Object.keys(row||{})))).forEach(function(k){
  if(clientField(k)||serverFields.indexOf(k)>=0||['images','briefImages','errorImages','fixImages'].indexOf(k)>=0)return;
  if(!equal(old[k],row[k]))out[k]=row[k]===undefined?null:row[k];
 });return out;
}
// Compare server revisions, never the local clock or an optimistic edit.
function snapshot(data){
 var next=Object.assign({},data||{});
 Object.keys(next).forEach(function(k){var old=confirmed[k],row=next[k];if(old&&row&&Number(old._syncRevision||0)>Number(row._syncRevision||0))next[k]=old;});
 confirmed=JSON.parse(JSON.stringify(next));lastRead=Date.now();return next;
}
function canRetry(op,remote){
 if(!op||!op.conflict||op.method!=='PATCH'||!op.baseValues||!remote||remote._deleted||op.data._deleted)return false;
 var keys=Object.keys(op.data).filter(function(k){return serverFields.indexOf(k)<0;});
 return keys.length>0&&keys.every(function(k){return Object.prototype.hasOwnProperty.call(op.baseValues,k)&&(equal(remote[k],op.baseValues[k])||equal(remote[k],op.data[k]));});
}
function rebaseAcknowledged(next,sent){
 if(!next.baseValues||!sent.baseValues)return;
 Object.keys(sent.data||{}).forEach(function(k){if(Object.prototype.hasOwnProperty.call(next.baseValues,k)&&Object.prototype.hasOwnProperty.call(sent.baseValues,k)&&equal(next.baseValues[k],sent.baseValues[k]))next.baseValues[k]=sent.data[k];});
}
function retireNoop(op,remote){
 if(!op||!op.conflict||!remote||!op.token||!op.data||!['PATCH','PUT'].includes(op.method))return false;
 if(Object.keys(op.data).some(function(k){return !clientField(k)&&serverFields.indexOf(k)<0;}))return false;
 if(archived[op.token])return true;
 var entry={operation:op,remoteUpdatedAt:Number(remote.updatedAt||0),resolvedAt:Date.now(),resolution:'no-business-fields'};
 try{var rows=JSON.parse(w.localStorage.getItem('rb_order_conflict_archive_v1')||'[]');if(!rows.some(function(x){return x.operation&&x.operation.token===op.token;})){rows.push(entry);w.localStorage.setItem('rb_order_conflict_archive_v1',JSON.stringify(rows));}archived[op.token]=true;return true;}catch(e){}
 if(w.rbDurableOrderQueue&&!archiving[op.token]){archiving[op.token]=true;archiveChain=archiveChain.then(async function(){var rows=await w.rbDurableOrderQueue.loadKey('order_noop_archive_v1');if(!rows.some(function(x){return x.operation&&x.operation.token===op.token;}))rows.push(entry);var ok=await w.rbDurableOrderQueue.saveKey('order_noop_archive_v1',rows);if(ok){archived[op.token]=true;setTimeout(function(){if(w.fbRefreshOrders)w.fbRefreshOrders();},0);}else delete archiving[op.token];}).catch(function(){delete archiving[op.token];});}
 return false;
}
async function backupConflicts(queue,data){
 var user=w._rbUser;if(backupBusy||!user||!user.uid||!w.rbFirebaseAuth)return;backupBusy=true;
 try{for(var op of queue||[]){op=JSON.parse(JSON.stringify(op));var remote=data&&data[String(op.path||'').split('/').pop()];if(!op.conflict||!op.token||backedUp[user.uid+'|'+op.token])continue;
  if(!Object.keys(op.data||{}).some(function(k){return !clientField(k)&&serverFields.indexOf(k)<0&&!equal(op.data[k],remote&&remote[k]);}))continue;
  var key=String(op.token).replace(/[.#$\[\]\/]/g,'_');
  var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},12000),response;
  try{response=await w.rbFirebaseAuth.fetch('https://richbiotech-c4e41-default-rtdb.firebaseio.com/workflow_snapshots/order_conflict_backups_v1/'+encodeURIComponent(user.uid)+'/'+key+'.json',{method:'PUT',signal:controller.signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({operation:op,online:remote||null,owner:user.name||'',build:(document.querySelector('meta[name="rb-build"]')||{}).content||'',backedUpAt:{'.sv':'timestamp'}})});}finally{clearTimeout(timer);}
  if(response.ok)backedUp[user.uid+'|'+op.token]=true;
 }}catch(e){}finally{backupBusy=false;}
}
w.rbOnlineConsistency={diff:diff,clientField:clientField,snapshot:snapshot,canRetry:canRetry,rebaseAcknowledged:rebaseAcknowledged,retireNoop:retireNoop,backupConflicts:backupConflicts,waitForArchives:function(){return archiveChain;},lastRead:function(){return lastRead;}};
// Inspect the same online device reports from any supervisor computer.
async function devices(){
 if(!w._rbUser||w._rbUser.role!=='sup')return;
 var box=document.createElement('dialog');box.style.cssText='margin:auto;max-width:1000px;width:92%;max-height:85vh;overflow:auto;padding:24px;border:1px solid #b5d9c9;border-radius:16px';
 var title=document.createElement('h2');title.textContent='เวอร์ชันและคิวซิงก์ของอุปกรณ์';box.appendChild(title);
 var close=document.createElement('button');close.textContent='ปิด';close.onclick=function(){box.close();box.remove();};box.appendChild(close);
 var backupsButton=document.createElement('button');backupsButton.textContent='ข้อมูลส่งงานที่สำรองออนไลน์';backupsButton.onclick=backups;box.appendChild(backupsButton);
 var body=document.createElement('div');body.textContent='กำลังอ่านรายงานออนไลน์…';box.appendChild(body);document.body.appendChild(box);box.showModal();
 try{var data=await new Promise(function(resolve,reject){(w.rbPersistence&&w.rbPersistence.readOnline||w.fbGet)('/workflow_snapshots/order_sync_diagnostics_v1',function(e,d){if(e)reject(e);else resolve(d);});});body.textContent='แสดงเฉพาะอุปกรณ์ที่เคยส่งรายงาน เวลาเก่าอาจหมายถึงปิดเว็บอยู่หรือยังใช้เวอร์ชันเดิม';
 Object.values(data||{}).forEach(function(user){Object.values(user||{}).forEach(function(report){var row=document.createElement('section');row.style.cssText='padding:12px;border-bottom:1px solid #ddd';var p=document.createElement('p');p.textContent=(report.employee||'ไม่ระบุ')+' · '+(report.build==='fix446'?'รายงานเดิม • ไม่ยืนยันเวอร์ชันเว็บ':report.build||'ไม่ทราบเวอร์ชัน')+' · ขัดกัน '+Number(report.count||0)+' รายการ · '+new Date(report.checkedAt||0).toLocaleString('th-TH');row.appendChild(p);if(report.conflicts&&report.conflicts.length){var detail=document.createElement('details'),summary=document.createElement('summary');summary.textContent='ดูงานและช่องที่ข้อมูลต่างกัน';detail.appendChild(summary);report.conflicts.forEach(function(item){var text=document.createElement('p');text.textContent=item.job+' · '+(item.fields||[]).join(', ')+' · ในเครื่อง '+item.localStatus+' / ออนไลน์ '+item.onlineStatus;detail.appendChild(text);});row.appendChild(detail);}body.appendChild(row);});});
 }catch(e){body.textContent='อ่านรายงานไม่สำเร็จ: '+e.message;}
}
async function backups(){
 if(!w._rbUser||w._rbUser.role!=='sup')return;
 var box=document.createElement('dialog');box.style.cssText='margin:auto;width:92%;max-width:1000px;max-height:85vh;overflow:auto;padding:24px;border-radius:16px';var title=document.createElement('h2');title.textContent='ข้อมูลส่งงานที่สำรองออนไลน์';box.appendChild(title);var close=document.createElement('button');close.textContent='ปิดข้อมูลสำรอง';close.onclick=function(){box.close();box.remove();};box.appendChild(close);var body=document.createElement('div');body.textContent='กำลังโหลด…';box.appendChild(body);document.body.appendChild(box);box.showModal();
 try{var data=await new Promise(function(resolve,reject){(w.rbPersistence&&w.rbPersistence.readOnline||w.fbGet)('/workflow_snapshots/order_conflict_backups_v1',function(e,d){if(e)reject(e);else resolve(d);});});var records=Object.values(data||{}).flatMap(function(rows){return Object.values(rows||{});});body.textContent=records.length?'สำเนาข้อมูลที่ยังไม่ได้รวมเข้ากับงานหลัก • ข้อมูลออนไลน์ที่แสดงคือขณะสำรอง กรุณาตรวจงานล่าสุดก่อนแก้ไข':'ยังไม่มีข้อมูลสำรองจากอุปกรณ์ • เครื่องที่มีคิวต้องเปิดเว็บรุ่นใหม่และเชื่อมออนไลน์ก่อน';records.forEach(function(record){var op=record.operation||{},row=document.createElement('section'),heading=document.createElement('h3');heading.textContent=(record.online&&record.online.id||op.data&&op.data.id||op.path)+' · '+(record.owner||'')+' · '+new Date(record.backedUpAt||0).toLocaleString('th-TH');row.appendChild(heading);Object.keys(op.data||{}).filter(function(k){return !clientField(k)&&serverFields.indexOf(k)<0;}).forEach(function(k){var p=document.createElement('p');p.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere';p.textContent=k+'\nแบบร่าง: '+JSON.stringify(op.data[k]).slice(0,10000)+'\nออนไลน์ขณะสำรอง: '+JSON.stringify(record.online&&record.online[k]||null).slice(0,10000);row.appendChild(p);});body.appendChild(row);});}catch(e){body.textContent='อ่านสำเนาไม่สำเร็จ: '+e.message;}
}
document.addEventListener('click',function(e){if(e.target.closest('[data-sync-devices]'))devices();});
// An open but silent stream or a stale leader must not suppress server reads.
setInterval(function(){if(!document.hidden&&navigator.onLine!==false&&w._rbUser&&Date.now()-lastRead>30000&&w.fbRefreshOrders)w.fbRefreshOrders();},15000);
})(window);
