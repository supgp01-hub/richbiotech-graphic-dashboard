(function(w){
'use strict';
var busy=false;
function esc(v){return String(v==null?'—':typeof v==='object'?JSON.stringify(v):v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function get(path){return new Promise(function(resolve,reject){w.fbGet(path,function(e,d){if(e)reject(e);else resolve(d);});});}
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
document.addEventListener('click',function(e){if(e.target.closest('[data-review-conflicts]'))open();});w.rbOrderConflictReview={open:open};
})(window);
