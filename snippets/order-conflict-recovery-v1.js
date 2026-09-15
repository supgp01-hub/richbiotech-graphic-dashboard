(function(w){
'use strict';
var DB='https://richbiotech-c4e41-default-rtdb.firebaseio.com',busy=false;
var fields=['submitLink','submitLinks','upLink','adLink','campExtra','auditVersions','firstSubmittedAt','firstSubmittedBy','imageSubmitLinks'];
function eq(a,b){return w.rbSafeOrderWrite.equal(a,b);}
function copy(x){return JSON.parse(JSON.stringify(x));}
function key(x){return String(x||'').replace(/[.#$\[\]\/]/g,'_');}
function supervisor(){if(!w._rbUser||w._rbUser.role!=='sup')throw new Error('เฉพาะหัวหน้างานที่ตรวจข้อมูลแล้ว');}
function valid(record){var op=record.operation;if(!record._ownerUid||!op||!op.token||!/^\/orders\/[^/.#$\[\]]+$/.test(op.path)||!op.conflict||!['PATCH','PUT'].includes(op.method))throw new Error('ข้อมูลสำรองไม่ครบ กรุณารอเครื่องต้นทางส่งใหม่');return op;}
function plan(record,remote){
 var op=valid(record),data=op.data||{},patch={},kept=[];
 if(!remote||remote._deleted||data._deleted)throw new Error('งานนี้ถูกลบหรือไม่มีในระบบ จึงไม่กู้ทับ');
 if(!record.online||!eq(record.online.assignee,remote.assignee))throw new Error('ผู้รับผิดชอบเปลี่ยนแล้ว กรุณาตรวจสอบแยกก่อนกู้');
 var first=['pending','inprogress'].includes(remote.status)&&!remote.firstSubmittedAt&&eq(remote.auditVersions,null)&&!(remote.reviewRounds&&Object.keys(remote.reviewRounds.events||{}).length);
 fields.forEach(function(k){if(eq(data[k],null)||eq(data[k],remote[k]))return;if(eq(remote[k],null)&&(k!=='auditVersions'||first))patch[k]=copy(data[k]);else kept.push(k);});
 var links=data.submitLinks||[data.submitLink||data.upLink];
 if(data.status==='review'&&first&&Array.isArray(links)&&links.some(function(s){return typeof s==='string'&&/^https?:\/\//.test(s);}))patch.status='review';
 Object.keys(data).forEach(function(k){if(!fields.includes(k)&&!['updatedAt','_version','_updatedBy','_syncRevision','_lastWriteToken','_fbKey','_assetsLoaded','_assetsChanged','_rbCacheCompacted','_rbReviewSubmit'].includes(k)&&!eq(data[k],remote[k])&&!Object.prototype.hasOwnProperty.call(patch,k))kept.push(k);});
 return {patch:patch,kept:Array.from(new Set(kept))};
}
async function request(path,opts){var c=new AbortController(),timer=setTimeout(function(){c.abort();},12000);try{var r=await w.rbFirebaseAuth.fetch(DB+path+'.json',Object.assign({},opts||{},{signal:c.signal}));if(!r.ok)throw new Error(r.status===412?'ข้อมูลออนไลน์เปลี่ยนระหว่างกู้ กรุณาเปิดตัวอย่างใหม่':'ยังไม่ได้รับยืนยันออนไลน์ ('+r.status+')');var data=await r.json();return {data:data,etag:r.headers.get('ETag')};}finally{clearTimeout(timer);}}
function receiptPath(record){return '/workflow_snapshots/order_conflict_resolutions_v1/'+record._ownerUid+'/'+key(record.operation.token);}
async function inspect(record){supervisor();var op=valid(record),r=await request(op.path, {headers:{'X-Firebase-ETag':'true'}}),receipt=await request(receiptPath(record));var resume=receipt.data&&receipt.data.state==='prepared'&&r.data&&r.data._lastWriteToken==='recover:'+op.token&&eq(receipt.data.operation.data,op.data);return {record:copy(record),remote:r.data,plan:plan(record,r.data),resume:!!resume};}
async function commit(preview){
 supervisor();var actor=copy(w._rbUser),record=preview.record,op=valid(record),path=receiptPath(record),token='recover:'+op.token;
 var done=await request(path);if(done.data&&done.data.state==='committed'&&eq(done.data.operation.data,op.data))return done.data;
 var live=await request(op.path,{headers:{'X-Firebase-ETag':'true'}});
 if(!live.etag)throw new Error('ตรวจเวอร์ชันข้อมูลออนไลน์ไม่ได้');
 var receipt=done.data;
 if(!(receipt&&receipt.state==='prepared'&&live.data&&live.data._lastWriteToken===token&&eq(receipt.operation.data,op.data))){
  if(!eq(live.data,preview.remote))throw new Error('ข้อมูลออนไลน์เปลี่ยนแล้ว กรุณาเปิดตัวอย่างใหม่');
  var p=plan(record,live.data);if(!Object.keys(p.patch).length)throw new Error('ไม่มีข้อมูลส่งงานที่เติมได้อย่างปลอดภัย');
  receipt={state:'prepared',operation:copy(op),before:copy(live.data),patch:p.patch,kept:p.kept,actor:actor.uid,preparedAt:Date.now()};
  await request(path,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(receipt)});
  supervisor();if(w._rbUser.uid!==actor.uid)throw new Error('บัญชีเปลี่ยนระหว่างกู้');
  var next=Object.assign({},live.data,p.patch,{updatedAt:Math.max(Date.now(),Number(live.data.updatedAt||0)+1),_syncRevision:Number(live.data._syncRevision||0)+1,_lastWriteToken:token});
  await request(op.path,{method:'PUT',headers:{'Content-Type':'application/json','if-match':live.etag},rbBaseUpdatedAt:Number(live.data.updatedAt||0),rbExpectedRecord:live.data,rbWriteToken:token,body:JSON.stringify(next)});
 }
 receipt.state='committed';receipt.committedAt=Date.now();
 await request(path,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(receipt)});
 if(w.fbRefreshOrders)w.fbRefreshOrders();return receipt;
}
async function consume(){
 var user=w._rbUser;if(busy||!user||!user.uid||!w.fbOrderQueueLoad||!w.fbOrderQueueSave)return;
 if(!w.fbOrderQueueLoad().some(function(op){return op.conflict;}))return;busy=true;
 try{var result=await request('/workflow_snapshots/order_conflict_resolutions_v1/'+user.uid);if(!w._rbUser||w._rbUser.uid!==user.uid)return;
  var queue=w.fbOrderQueueLoad(),next=queue.filter(function(op){var r=result.data&&result.data[key(op.token)];return !(op.conflict&&r&&r.state==='committed'&&r.operation&&r.operation.token===op.token&&r.operation.path===op.path&&r.operation.method===op.method&&eq(r.operation.data,op.data));});
  if(next.length!==queue.length){w.fbOrderQueueSave(next);if(w.fbRefreshOrders)w.fbRefreshOrders();}
 }catch(e){}finally{busy=false;}
}
async function show(record){
 supervisor();var box=document.createElement('dialog');box.style.cssText='margin:auto;padding:24px;border-radius:16px;max-width:900px;width:92%;max-height:85vh;overflow:auto';
 var title=document.createElement('h2');title.textContent='ตรวจข้อมูลก่อนกู้ส่งงาน';box.appendChild(title);var body=document.createElement('div');body.style.whiteSpace='pre-wrap';body.textContent='กำลังเทียบกับงานออนไลน์ล่าสุด…';box.appendChild(body);
 var cancel=document.createElement('button');cancel.textContent='ปิดตัวอย่าง';cancel.onclick=function(){box.close();box.remove();};box.appendChild(cancel);document.body.appendChild(box);box.showModal();
 try{var p=await inspect(record);body.textContent=(p.remote.id||record.operation.path)+' · '+p.remote.assignee+'\nเติมเฉพาะข้อมูลส่งงานที่ยังว่าง:\n'+JSON.stringify(p.plan.patch,null,2)+'\n\nใช้ข้อมูลออนไลน์ปัจจุบันสำหรับ: '+(p.plan.kept.join(', ')||'ไม่มีช่องที่ขัดกัน')+'\nสำเนาต้นฉบับจะยังอยู่ครบ หลังบันทึกสำเร็จเครื่องต้นทางจะรับใบยืนยันและปลดคิวรายการนี้';
  if(Object.keys(p.plan.patch).length||p.resume){var button=document.createElement('button');button.textContent=p.resume?'ยืนยันใบรับข้อมูลออนไลน์อีกครั้ง':'กู้ข้อมูลส่งงานและยืนยันออนไลน์';button.onclick=async function(){button.disabled=true;cancel.disabled=true;try{await commit(p);body.textContent='กู้ข้อมูลส่งงานออนไลน์สำเร็จ • เก็บสำเนาต้นฉบับและข้อมูลเดิมไว้แล้ว';button.remove();}catch(e){body.textContent+='\n\nยังไม่สำเร็จ: '+e.message;button.disabled=false;}finally{cancel.disabled=false;}};box.appendChild(button);}
 }catch(e){body.textContent=e.message;}
}
w.rbOrderConflictRecovery={plan:plan,inspect:inspect,commit:commit,consume:consume,show:show};
})(window);
