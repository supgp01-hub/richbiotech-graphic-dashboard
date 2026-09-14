(function(w){
'use strict';
var busy=false;
// One-time recovery for the two assignments explicitly corrected by Supervisor.
// Only obsolete routing/status fields may differ; unique work content stays queued.
function repairConfirmedAssignment(op,remote){
 var fixes={'/orders/planner_draft_1789296847585_x39t0':'DOM','/orders/planner_draft_1789297141225_bntkh':'JAM'},assignee=fixes[op&&op.path];
 if(!assignee||!op.conflict||!remote||remote._deleted||remote.assignee!==assignee||!op.ts||Number(op.ts)>1789362517570||!op.data||op.data._deleted)return false;
 var ignored=['assignee','status','updatedAt','_version','_updatedBy','_syncRevision','_lastWriteToken'];
 var same=Object.keys(op.data).filter(function(k){return ignored.indexOf(k)<0;}).every(function(k){var a=op.data[k],b=remote[k];if((a==null||a==='')&&(b==null||b===''))return true;return JSON.stringify(a)===JSON.stringify(b);});
 if(!same||!['pending','inprogress'].includes(op.data.status||'pending'))return false;
 try{var archive=JSON.parse(localStorage.getItem('rb_order_conflict_archive_v1')||'[]');if(!archive.some(function(x){return x.operation&&x.operation.token===op.token;})){archive.push({operation:op,remote:remote,resolvedAt:Date.now(),resolution:'supervisor-confirmed-assignment'});localStorage.setItem('rb_order_conflict_archive_v1',JSON.stringify(archive));}return true;}catch(e){return false;}
}


function recoverMissingAudit(op,remote){
 if(!op||!op.conflict||op.method!=='PATCH'||!remote||remote._deleted||!op.data||op.data._deleted||!w.rbSafeOrderWrite)return null;
 var metadata=['updatedAt','_version','_updatedBy','_syncRevision','_lastWriteToken'],fields=Object.keys(op.data).filter(function(k){return metadata.indexOf(k)<0&&!w.rbSafeOrderWrite.equal(op.data[k],remote[k]);});
 if(!fields.length||!fields.every(function(k){return ['auditError','auditFixed'].includes(k)&&remote[k]==null&&typeof op.data[k]==='string';}))return null;
 var data={updatedAt:Math.max(Date.now(),Number(remote.updatedAt||0)+1)},base={};fields.forEach(function(k){data[k]=op.data[k];base[k]=null;});
 var next=Object.assign({},op,{token:op.token+'_audit445',data:data,baseValues:base,baseUpdatedAt:Number(remote.updatedAt||0),conflict:false,attempts:0,nextAttemptAt:0});delete next.conflictMessage;
 try{var archive=JSON.parse(localStorage.getItem('rb_order_conflict_archive_v1')||'[]');archive.push({operation:op,resolvedAt:Date.now(),resolution:'merge-missing-audit-fields'});localStorage.setItem('rb_order_conflict_archive_v1',JSON.stringify(archive));}catch(e){return null;}return next;
}
var reportSignature='',reportBusy=false;
function report(queue,data){
 var u=w._rbUser||{};if(!u.uid||!w.rbFirebaseAuth||reportBusy)return;
 var conflicts=(queue||[]).filter(function(op){return op.conflict;}).map(function(op){var remote=data[String(op.path||'').split('/').pop()]||{},fields=Object.keys(op.data||{}).filter(function(k){return !['updatedAt','_version','_updatedBy','_syncRevision','_lastWriteToken'].includes(k)&&!w.rbSafeOrderWrite.equal(op.data[k],remote[k]);});return {job:remote.id||op.data&&op.data.id||op.path,fields:fields,localAssignee:op.data&&op.data.assignee||'',onlineAssignee:remote.assignee||'',localStatus:op.data&&op.data.status||'',onlineStatus:remote.status||'',queuedAt:Number(op.ts||0),baseUpdatedAt:Number(op.baseUpdatedAt||0),onlineUpdatedAt:Number(remote.updatedAt||0)};});
 var signature=u.uid+JSON.stringify(conflicts);if(signature===reportSignature)return;
 var device;try{device=localStorage.getItem('rb_sync_device_v1');if(!device){device='device_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);localStorage.setItem('rb_sync_device_v1',device);}}catch(e){return;}
 reportBusy=true;w.rbFirebaseAuth.fetch('https://richbiotech-c4e41-default-rtdb.firebaseio.com/workflow_snapshots/order_sync_diagnostics_v1/'+encodeURIComponent(u.uid)+'/'+encodeURIComponent(device)+'.json',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({build:'fix445',employee:u.name||'',count:conflicts.length,conflicts:conflicts,checkedAt:{'.sv':'timestamp'}})}).then(function(r){if(r.ok)reportSignature=signature;}).catch(function(){}).finally(function(){reportBusy=false;});
}
function esc(v){return String(v==null?'—':typeof v==='object'?JSON.stringify(v):v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function get(path){return new Promise(function(resolve,reject){(w.rbPersistence&&w.rbPersistence.readOnline||w.fbGet)(path,function(e,d){if(e)reject(e);else resolve(d);});});}
async function open(){
 if(busy)return;busy=true;
 var box=document.getElementById('rb-conflict-review');if(!box){box=document.createElement('section');box.id='rb-conflict-review';box.style.cssText='position:fixed;inset:5%;z-index:110000;background:white;color:#173e47;padding:24px;overflow:auto;border:2px solid #008781;border-radius:16px;box-shadow:0 0 0 100vmax #0008';document.body.appendChild(box);}
 box.innerHTML='<h2>ตรวจรายการข้อมูลขัดกัน</h2><p>กำลังเทียบกับข้อมูลออนไลน์…</p>';
 try{
 var queue=w.fbOrderQueueLoad().filter(function(op){return op.conflict;});
 var rows=await Promise.all(queue.map(async function(op){return {op:op,remote:await get(op.path)};}));
 box.innerHTML='<h2>ตรวจรายการข้อมูลขัดกัน</h2><p>ข้อมูลออนไลน์ยังใช้ทำงานได้ เลือกใช้ข้อมูลออนไลน์เมื่อได้ตรวจความต่างแล้ว ระบบจะเก็บสำเนาคิวเดิมไว้ในเครื่องก่อนปลดคิว</p><button type="button" data-close>ปิด</button>';
 if(!rows.length)box.insertAdjacentHTML('beforeend','<p>ไม่พบรายการข้อมูลขัดกันในเบราว์เซอร์นี้</p>');
 rows.forEach(function(row){var op=row.op,remote=row.remote,article=document.createElement('article');article.style.cssText='border:1px solid #ccdedd;padding:16px;margin-top:16px';var keys=Object.keys(op.data||{}).filter(function(k){return !['updatedAt','_version','_updatedBy','_syncRevision','_lastWriteToken'].includes(k)&&JSON.stringify(op.data[k]??null)!==JSON.stringify((remote&&remote[k])??null);});
 article.innerHTML='<h3>'+esc(remote&&remote.id||op.path)+' · '+esc(remote&&remote.assignee)+'</h3><table style="width:100%;table-layout:fixed"><thead><tr><th>ช่องข้อมูล</th><th>คิวเดิมในเครื่อง</th><th>ออนไลน์ล่าสุด</th></tr></thead><tbody>'+keys.map(function(k){return '<tr><td>'+esc(k)+'</td><td style="overflow-wrap:anywhere">'+esc(op.data[k])+'</td><td style="overflow-wrap:anywhere">'+esc(remote&&remote[k])+'</td></tr>';}).join('')+'</tbody></table><button type="button" data-online>ใช้ข้อมูลออนไลน์และเก็บสำเนาคิวเดิม</button><p role="status"></p>';
 article.querySelector('[data-online]').onclick=async function(){var button=this,status=article.querySelector('[role=status]');button.disabled=true;try{var fresh=await get(op.path);if(JSON.stringify(fresh)!==JSON.stringify(remote))throw Error('ข้อมูลออนไลน์เปลี่ยนอีกครั้ง กรุณาปิดแล้วเปิดตรวจใหม่');var current=w.fbOrderQueueLoad(),found=current.find(function(x){return x.token===op.token;});if(!found)throw Error('คิวนี้ถูกจัดการแล้ว กรุณาเปิดตรวจใหม่');var archive=JSON.parse(localStorage.getItem('rb_order_conflict_archive_v1')||'[]');archive.push({operation:found,remote:fresh,resolvedAt:Date.now(),resolution:'use-online'});localStorage.setItem('rb_order_conflict_archive_v1',JSON.stringify(archive));w.fbOrderQueueSave(current.filter(function(x){return x.token!==op.token;}));w.fbRefreshOrders();status.textContent='เก็บสำเนาแล้ว ใช้ข้อมูลออนไลน์เรียบร้อย';}catch(e){status.textContent=e.message;button.disabled=false;}};
 box.appendChild(article);});box.querySelector('[data-close]').onclick=function(){box.remove();};
 }catch(e){box.innerHTML='<p>'+esc(e.message)+'</p><button type="button">ปิด</button>';box.querySelector('button').onclick=function(){box.remove();};}finally{busy=false;}
}
document.addEventListener('click',function(e){if(e.target.closest('[data-review-conflicts]'))open();});w.rbOrderConflictReview={open:open,recoverMissingAudit:recoverMissingAudit,report:report,repairConfirmedAssignment:repairConfirmedAssignment};
})(window);
