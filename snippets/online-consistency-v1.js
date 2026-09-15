(function(w){
'use strict';
var cacheFields=['_fbKey','_assetsLoaded','_assetsChanged','_rbCacheCompacted','_rbReviewSubmit'];
var serverFields=['updatedAt','_version','_updatedBy','_syncRevision','_lastWriteToken'];
var confirmed={},lastRead=0;
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
w.rbOnlineConsistency={diff:diff,clientField:clientField,snapshot:snapshot,canRetry:canRetry,rebaseAcknowledged:rebaseAcknowledged,lastRead:function(){return lastRead;}};
// Inspect the same online device reports from any supervisor computer.
async function devices(){
 if(!w._rbUser||w._rbUser.role!=='sup')return;
 var box=document.createElement('dialog');box.style.cssText='margin:auto;max-width:1000px;width:92%;max-height:85vh;overflow:auto;padding:24px;border:1px solid #b5d9c9;border-radius:16px';
 var title=document.createElement('h2');title.textContent='เวอร์ชันและคิวซิงก์ของอุปกรณ์';box.appendChild(title);
 var close=document.createElement('button');close.textContent='ปิด';close.onclick=function(){box.close();box.remove();};box.appendChild(close);
 var body=document.createElement('div');body.textContent='กำลังอ่านรายงานออนไลน์…';box.appendChild(body);document.body.appendChild(box);box.showModal();
 try{var data=await new Promise(function(resolve,reject){(w.rbPersistence&&w.rbPersistence.readOnline||w.fbGet)('/workflow_snapshots/order_sync_diagnostics_v1',function(e,d){if(e)reject(e);else resolve(d);});});body.textContent='แสดงเฉพาะอุปกรณ์ที่เคยส่งรายงาน เวลาเก่าอาจหมายถึงปิดเว็บอยู่หรือยังใช้เวอร์ชันเดิม';
 Object.values(data||{}).forEach(function(user){Object.values(user||{}).forEach(function(report){var row=document.createElement('section');row.style.cssText='padding:12px;border-bottom:1px solid #ddd';var p=document.createElement('p');p.textContent=(report.employee||'ไม่ระบุ')+' · '+(report.build||'ไม่ทราบเวอร์ชัน')+' · ขัดกัน '+Number(report.count||0)+' รายการ · '+new Date(report.checkedAt||0).toLocaleString('th-TH');row.appendChild(p);if(report.conflicts&&report.conflicts.length){var detail=document.createElement('details'),summary=document.createElement('summary');summary.textContent='ดูงานและช่องที่ข้อมูลต่างกัน';detail.appendChild(summary);report.conflicts.forEach(function(item){var text=document.createElement('p');text.textContent=item.job+' · '+(item.fields||[]).join(', ')+' · ในเครื่อง '+item.localStatus+' / ออนไลน์ '+item.onlineStatus;detail.appendChild(text);});row.appendChild(detail);}body.appendChild(row);});});
 }catch(e){body.textContent='อ่านรายงานไม่สำเร็จ: '+e.message;}
}
document.addEventListener('click',function(e){if(e.target.closest('[data-sync-devices]'))devices();});
// An open but silent stream or a stale leader must not suppress server reads.
setInterval(function(){if(!document.hidden&&navigator.onLine!==false&&w._rbUser&&Date.now()-lastRead>30000&&w.fbRefreshOrders)w.fbRefreshOrders();},15000);
})(window);
