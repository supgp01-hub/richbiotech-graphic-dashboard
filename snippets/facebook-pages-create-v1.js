(function(root){
'use strict';
var busy=false;
function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function options(values){return Array.from(new Set(values||[])).filter(Boolean).map(function(v){return '<option value="'+esc(v)+'">';}).join('');}
function field(label,id,extra,placeholder){return '<label>'+label+'<input id="'+id+'" '+(extra||'')+' placeholder="'+esc(placeholder||'')+'"></label>';}
function renderForm(){var box=document.getElementById('fp-form-box');if(!box)return;
 box.innerHTML='<form class="rb-fbp-create" id="fp-create-form"><h3>＋ เพิ่มข้อมูลเพจใหม่</h3><div class="rb-fbp-create-grid">'+field('ชื่อเพจ *','fp-in-name','required','เช่น WOLF พลังหมาป่า')+field('สินค้า','fp-in-prod','list="fp-dl-prod"','เลือกหรือพิมพ์สินค้า')+field('พนักงานผู้รับผิดชอบ','fp-in-own','list="fp-dl-own"','เลือกหรือพิมพ์ชื่อพนักงาน')+'<label>สถานะ<select id="fp-in-st"><option>ใช้งาน</option><option>ว่าง</option><option>โดนระงับถาวร</option><option>เพจโดนปิดใช้งาน</option></select></label><div class="rb-fbp-creator">'+field('ชื่อเฟสที่สร้างเพจ','fp-in-creator','','เช่น Nune Richbiotech')+'<small>ชื่อบัญชี Facebook ที่ใช้สร้างเพจ แยกจากบัญชีที่สามารถแชร์ได้</small></div></div><datalist id="fp-dl-prod">'+options(root._fpProdsCache)+'</datalist><datalist id="fp-dl-own">'+options(root._fpOwnersCache)+'</datalist><div id="fp-err" role="status" aria-live="polite">บันทึกสำเร็จเมื่อระบบยืนยันข้อมูลออนไลน์</div><footer><button type="button" id="fp-create-cancel">ยกเลิก</button><button type="submit" id="fp-create-save">✓ บันทึกเพจ</button></footer></form>';
 box.querySelector('form').addEventListener('submit',function(e){e.preventDefault();saveEntry();});
 box.querySelector('#fp-create-cancel').addEventListener('click',function(){if(!busy){box.style.display='none';box.innerHTML='';}});
}
function value(id){var el=document.getElementById(id);return String(el&&el.value||'').trim();}
function saveEntry(){
 if(busy)return Promise.resolve(false);
 var form=document.getElementById('fp-create-form'),err=document.getElementById('fp-err'),button=document.getElementById('fp-create-save');
 var name=value('fp-in-name');if(!name){if(err)err.textContent='กรุณากรอกชื่อเพจ';return Promise.resolve(false);}
 var id=form.dataset.entryId||(form.dataset.entryId='fp_'+Date.now()+'_'+Math.random().toString(36).slice(2,9));
 var entry={id:id,name:name,prod:value('fp-in-prod'),own:value('fp-in-own'),st:value('fp-in-st'),creatorFacebook:value('fp-in-creator'),manual:true,createdAt:Date.now()};entry.emp=entry.own;
 busy=true;button.disabled=true;document.getElementById('fp-create-cancel').disabled=true;button.textContent='กำลังบันทึก...';err.textContent='กำลังรอการยืนยันจากระบบออนไลน์...';err.dataset.error='false';
 return Promise.resolve().then(function(){if(typeof root.fbSet!=='function')throw new Error('ระบบออนไลน์ยังไม่พร้อม');return root.fbSet('/fbpages_manual/'+id,entry);}).then(function(ok){if(ok!==true)throw new Error('บันทึกออนไลน์ไม่สำเร็จ กรุณาตรวจการเชื่อมต่อแล้วลองอีกครั้ง');
  var rows=(root._fpManual||[]).filter(function(r){return r.id!==id;});rows.push(entry);root._fpSaveLocal(rows);
  var box=document.getElementById('fp-form-box');box.style.display='none';box.innerHTML='';
  var target=document.getElementById('fbl-root');if(target&&root._renderFbList)root._renderFbList(target,root._fpMerge(root._lfbData||[]));
  var status=document.getElementById('lfb-ts');if(status)status.textContent='เพิ่มเพจ “'+entry.name+'” ออนไลน์เรียบร้อยแล้ว';return true;
 }).catch(function(error){err.textContent=(error.message||'บันทึกไม่สำเร็จ')+' · ข้อมูลที่กรอกยังอยู่';err.dataset.error='true';return false;}).finally(function(){busy=false;if(button.isConnected){button.disabled=false;button.textContent='✓ บันทึกเพจ';var cancel=document.getElementById('fp-create-cancel');if(cancel)cancel.disabled=false;}});
}
root._fpRenderForm=renderForm;root._fpSaveEntry=saveEntry;
root._fpToggleForm=function(){if(busy)return;var box=document.getElementById('fp-form-box');if(!box)return;if(box.style.display==='none'||!box.firstElementChild){box.style.display='block';renderForm();}else{box.style.display='none';box.innerHTML='';}};
// Local storage can be full; that must not prevent a confirmed server write.
root._fpSaveLocal=function(rows){root._fpManual=rows;try{localStorage.setItem(root._fpKey,JSON.stringify(rows));}catch(error){}};
root._fpSyncFromCloud=function(done){
 var started=Date.now();if(typeof root.fbGet!=='function'){if(done)done();return;}
 root.fbGet('/fbpages_manual',function(error,data){
  if(!error){var rows=(Array.isArray(data)?data:Object.values(data||{})).filter(function(r){return r&&r.id;}),byId={};rows.forEach(function(r){byId[r.id]=r;});
   (root._fpManual||[]).forEach(function(r){if(Number(r.createdAt)>started&&(!byId[r.id]||Number(r.createdAt)>Number(byId[r.id].createdAt)))byId[r.id]=r;});root._fpSaveLocal(Object.values(byId));
  }if(done)done(error);
 });
};
root.rbFacebookPageCreate={render:renderForm,save:saveEntry};
})(window);
