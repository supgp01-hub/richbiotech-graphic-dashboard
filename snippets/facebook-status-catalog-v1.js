(function(){
'use strict';
if(window._rbFacebookStatusCatalogLoaded)return;
window._rbFacebookStatusCatalogLoaded=true;

var CATALOG=[
  {value:'ใช้งาน',follow:false,group:'พร้อมใช้',tone:'safe',description:'บัญชีใช้งานได้ตามปกติ',action:'ไม่ต้องติดตาม'},
  {value:'ว่าง',follow:false,group:'พร้อมใช้',tone:'idle',description:'บัญชียังไม่ได้มอบหมายหรือยังไม่ถูกใช้งาน',action:'ไม่ต้องติดตาม'},
  {value:'เราเปิดใช้งานบัญชีของคุณแล้ว',follow:false,group:'พร้อมใช้',tone:'safe',description:'Facebook เปิดบัญชีกลับมาใช้งานแล้ว',action:'ตรวจความพร้อมก่อนนำกลับมาใช้'},
  {value:'บัญชีโฆษณาถูกจำกัดแต่บัญชี FACEBOOK ยังใช้งานได้',follow:false,group:'พร้อมใช้',tone:'safe',description:'บัญชี Facebook ยังเข้าใช้งานได้ แม้ Ad Account ถูกจำกัด',action:'ไม่ต้องติดตามบัญชี Facebook'},
  {value:'เราปิดใช้งานบัญชีของคุณแล้ว',follow:false,group:'ปิด/พักใช้',tone:'closed',description:'บัญชีถูกปิดใช้งานและไม่อยู่ในคิวแก้ไข',action:'ไม่ต้องติดตาม'},
  {value:'บัญชีของคุณถูกปิดใช้งาน',follow:false,group:'ปิด/พักใช้',tone:'closed',description:'บัญชีปิดใช้งานแล้ว',action:'ไม่ต้องติดตาม'},
  {value:'ห้ามใช้',follow:false,group:'ปิด/พักใช้',tone:'closed',description:'บัญชีถูกกำหนดว่าไม่ให้นำมาใช้งาน',action:'ไม่ต้องติดตาม'},
  {value:'Manus',follow:false,group:'ปิด/พักใช้',tone:'idle',description:'บัญชีอยู่ในขั้นตอนหรือการจัดการผ่าน Manus',action:'ไม่ต้องติดตามตามข้อมูลต้นทาง'},
  {value:'นำมาใช้',follow:false,group:'พร้อมใช้',tone:'safe',description:'บัญชีพร้อมนำกลับมาใช้งาน',action:'ไม่ต้องติดตาม'},
  {value:'เปลี่ยนเฟสใหม่แล้ว',follow:false,group:'พร้อมใช้',tone:'safe',description:'เปลี่ยนบัญชี Facebook ใหม่เรียบร้อยแล้ว',action:'ไม่ต้องติดตาม'},

  {value:'บัญชีถูกจำกัด',follow:true,group:'ข้อจำกัดบัญชี',tone:'danger',description:'บัญชีถูก Facebook จำกัดการใช้งาน',action:'ตรวจสาเหตุและยื่นคำขอทบทวน'},
  {value:'ติด WHATAPP',follow:true,group:'ยืนยันตัวตน',tone:'verify',description:'Facebook ขอการยืนยันผ่าน WhatsApp',action:'ดำเนินการยืนยัน WhatsApp'},
  {value:'ติดwhatsapp',follow:true,group:'ยืนยันตัวตน',tone:'verify',description:'Facebook ขอการยืนยันผ่าน WhatsApp',action:'ดำเนินการยืนยัน WhatsApp'},
  {value:'ติดสแกนหน้า',follow:true,group:'ยืนยันตัวตน',tone:'verify',description:'บัญชีต้องสแกนใบหน้าเพื่อยืนยันตัวตน',action:'นัดหมายผู้ถือบัญชีเพื่อสแกนหน้า'},
  {value:'Facebook โดนยืนยันสแกนหน้า',follow:true,group:'ยืนยันตัวตน',tone:'verify',description:'Facebook บังคับให้ยืนยันด้วยการสแกนหน้า',action:'ดำเนินการสแกนหน้าให้เรียบร้อย'},
  {value:'Facebook โดนยืนยันเบอร์',follow:true,group:'ยืนยันตัวตน',tone:'verify',description:'Facebook ขอรหัสยืนยันจากหมายเลขโทรศัพท์',action:'ยืนยันเบอร์โทรศัพท์'},
  {value:'ติดยืนยันบัญชี (Ads จะต่อไม่ได้ถ้าไม่ยืนยัน)',follow:true,group:'ยืนยันตัวตน',tone:'verify',description:'ต้องยืนยันบัญชีก่อนจึงจะเชื่อมต่อ Ads ได้',action:'ยืนยันบัญชีให้เสร็จก่อนใช้งาน Ads'},
  {value:'อัพโหลดเอกสารประจำตัว',follow:true,group:'ยืนยันตัวตน',tone:'verify',description:'Facebook ขอเอกสารประจำตัวเพื่อยืนยันบัญชี',action:'เตรียมและอัปโหลดเอกสาร'},
  {value:'ติด reCAPTCHA',follow:true,group:'ยืนยันตัวตน',tone:'verify',description:'บัญชีติดขั้นตอนตรวจสอบ reCAPTCHA',action:'เปิดบัญชีและผ่าน reCAPTCHA'},

  {value:'รหัส Facebook ผิด',follow:true,group:'เข้าใช้งานไม่ได้',tone:'danger',description:'รหัสผ่าน Facebook ไม่ถูกต้อง',action:'ตรวจรหัสหรือรีเซ็ตรหัสผ่าน'},
  {value:'รหัส 2FA ผิด',follow:true,group:'เข้าใช้งานไม่ได้',tone:'danger',description:'รหัส Two-Factor Authentication ไม่ถูกต้อง',action:'ตรวจหรือสร้างรหัส 2FA ใหม่'},
  {value:'เข้าอีเมลไม่ได้',follow:true,group:'เข้าใช้งานไม่ได้',tone:'danger',description:'ไม่สามารถเข้าอีเมลหลักของบัญชีได้',action:'กู้คืนหรือเปลี่ยนข้อมูลอีเมล'},
  {value:'ไม่สามารถเข้าเมลสำรองได้',follow:true,group:'เข้าใช้งานไม่ได้',tone:'danger',description:'ไม่สามารถเข้าอีเมลสำรองได้',action:'กู้คืนอีเมลสำรอง'},
  {value:'เข้าเมลสำรองไม่ได้',follow:true,group:'เข้าใช้งานไม่ได้',tone:'danger',description:'ไม่สามารถเข้าอีเมลสำรองได้',action:'กู้คืนอีเมลสำรอง'},
  {value:'เข้าเฟสไมได้',follow:true,group:'เข้าใช้งานไม่ได้',tone:'danger',description:'ไม่สามารถเข้าสู่บัญชี Facebook ได้',action:'ตรวจข้อมูลล็อกอินและกู้คืนบัญชี'},
  {value:'เฟสโดนล๊อค',follow:true,group:'เข้าใช้งานไม่ได้',tone:'danger',description:'บัญชี Facebook ถูกล็อก',action:'ดำเนินการปลดล็อกบัญชี'},
  {value:'เปลี่ยนรสกุลเงินไม่ได้',follow:true,group:'การตั้งค่าโฆษณา',tone:'warning',description:'ไม่สามารถเปลี่ยนสกุลเงินของบัญชีโฆษณาได้',action:'ตรวจสิทธิ์และการตั้งค่า Ad Account'},
  {value:'ส่งคำขอผ่านองกรณ์',follow:true,group:'รอการพิจารณา',tone:'waiting',description:'ส่งคำขอทบทวนผ่าน Business/Organization แล้ว',action:'ติดตามผลการพิจารณา'},
  {value:'ส่งคำขอทบทวนผ่านองค์กร',follow:true,group:'รอการพิจารณา',tone:'waiting',description:'ส่ง Ad Appeal ผ่าน Business/Organization แล้ว',action:'ติดตามผลการพิจารณา'},
  {value:'ส่งคำขอทบทวนผล',follow:true,group:'รอการพิจารณา',tone:'waiting',description:'ส่ง Ad Appeal ผ่านบัญชีส่วนตัวแล้ว',action:'ติดตามผลการพิจารณา'}
];
var DEFAULT_CATALOG=CATALOG.map(function(item){return Object.assign({},item);});
var CLOUD_PATH='/facebook_status_catalog_v1',CACHE_KEY='rb_facebook_status_catalog_v1';
var guideDraft=null,guideDirty=false,guideSaving=false,guideTextOpen={},catalogMeta={updatedAt:0,updatedBy:''};

function esc(value){return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function norm(value){return String(value||'').trim().toLowerCase().replace(/\s+/g,'');}
function canEditGuide(){return !!(window._rbUser&&window._rbUser.role==='sup');}
function cleanText(value,max){return String(value==null?'':value).trim().slice(0,max||500);}
function normalizeCatalog(items){
  var incoming={};
  (Array.isArray(items)?items:[]).forEach(function(item){if(item&&item.value)incoming[norm(item.value)]=item;});
  return DEFAULT_CATALOG.map(function(base){
    var saved=incoming[norm(base.value)]||{},description=cleanText(saved.description,300),action=cleanText(saved.action,300);
    return Object.assign({},base,{follow:typeof saved.follow==='boolean'?saved.follow:base.follow,description:description||base.description,action:action||base.action});
  });
}
function applyCatalog(items,metaInfo){
  CATALOG=normalizeCatalog(items);catalogMeta=Object.assign({updatedAt:0,updatedBy:''},metaInfo||{});
  window.rbFacebookStatusCatalog=CATALOG;
  if(window._rbFacebookStatusTest)window._rbFacebookStatusTest.catalog=CATALOG;
  try{localStorage.setItem(CACHE_KEY,JSON.stringify({items:CATALOG,updatedAt:catalogMeta.updatedAt,updatedBy:catalogMeta.updatedBy}));}catch(_error){}
  try{window.dispatchEvent(new CustomEvent('rb:facebook-status-catalog-updated',{detail:{catalog:CATALOG,meta:catalogMeta}}));}catch(_error){}
}
function loadCachedCatalog(){try{var cached=JSON.parse(localStorage.getItem(CACHE_KEY)||'null');if(cached&&Array.isArray(cached.items))applyCatalog(cached.items,cached);}catch(_error){}}
function loadCloudCatalog(done){
  if(typeof window.fbGet!=='function'){if(done)done(false);return;}
  window.fbGet(CLOUD_PATH,function(error,data){if(!error&&data&&Array.isArray(data.items)){applyCatalog(data.items,data);if(done)done(true);return;}if(done)done(false);});
}
function meta(value){var key=norm(value);for(var i=0;i<CATALOG.length;i++){if(norm(CATALOG[i].value)===key)return CATALOG[i];}return null;}
function needsFollowup(value){var item=meta(value);return item?item.follow:false;}
function values(){return CATALOG.map(function(item){return item.value;});}
function groups(){var result=[];CATALOG.forEach(function(item){var group=result.find(function(entry){return entry.name===item.group;});if(!group){group={name:item.group,items:[]};result.push(group);}group.items.push(item);});return result;}
function setSelect(select,current,includeAll){
  if(!select)return;
  var selected=String(current||''),known=meta(selected),html=includeAll?'<option value="ALL">สถานะทั้งหมด</option>':'';
  if(selected&&selected!=='ALL'&&!known)html+='<optgroup label="ค่าปัจจุบันจากข้อมูลเดิม"><option value="'+esc(selected)+'">'+esc(selected)+'</option></optgroup>';
  groups().forEach(function(group){html+='<optgroup label="'+esc(group.name)+'">'+group.items.map(function(item){return'<option value="'+esc(item.value)+'">'+(item.follow?'● ต้องติดตาม — ':'✓ ไม่ต้องติดตาม — ')+esc(item.value)+'</option>';}).join('')+'</optgroup>';});
  select.innerHTML=html;select.value=includeAll?(selected||'ALL'):selected||CATALOG[0].value;
}
function badge(value){var item=meta(value),follow=item&&item.follow,tone=item?item.tone:'idle';return'<span class="rb-fb-status-badge is-'+tone+'" title="'+esc(item?item.description:'สถานะจากข้อมูลเดิม')+'"><span aria-hidden="true">'+(follow?'!':'✓')+'</span>'+esc(value||'ยังไม่ระบุ')+'</span>';}
function updateHelp(value){var host=document.getElementById('lfbe-st-help');if(!host)return;var item=meta(value);if(!item){host.className='rb-fb-status-help is-unknown';host.innerHTML='<b>สถานะจากข้อมูลเดิม</b><span>ยังไม่มีคำอธิบายในคู่มือ กรุณาตรวจสอบก่อนบันทึก</span>';return;}host.className='rb-fb-status-help '+(item.follow?'is-follow':'is-safe');host.innerHTML='<b>'+(item.follow?'ต้องติดตาม':'ไม่ต้องติดตาม')+'</b><span>'+esc(item.description)+' · '+esc(item.action)+'</span><button type="button" onclick="window.rbOpenFacebookStatusGuide()">เปิดคู่มือ</button>';}
function badgeForItem(item){var tone=item?item.tone:'idle';return'<span class="rb-fb-status-badge is-'+tone+'" title="'+esc(item?item.description:'สถานะจากข้อมูลเดิม')+'"><span aria-hidden="true">'+(item&&item.follow?'!':'✓')+'</span>'+esc(item&&item.value||'ยังไม่ระบุ')+'</span>';}
function guideCards(){
  var items=guideDraft||CATALOG,editing=!!guideDraft;
  return items.map(function(item,index){
    var label='<span class="rb-fb-follow-label '+(item.follow?'is-follow':'is-safe')+'">'+(item.follow?'ต้องติดตาม':'ไม่ต้องติดตาม')+'</span>';
    var control=editing?'<label class="rb-fb-guide-switch"><input type="checkbox" data-guide-follow="'+index+'"'+(item.follow?' checked':'')+'><span></span><b>'+(item.follow?'ต้องติดตาม':'ไม่ต้องติดตาม')+'</b></label>':label;
    var fields='<label class="rb-fb-guide-field"><span>คำอธิบาย</span><textarea data-guide-text="description" data-guide-index="'+index+'" maxlength="300">'+esc(item.description)+'</textarea></label><label class="rb-fb-guide-field"><span>ทีมต้องทำ</span><textarea data-guide-text="action" data-guide-index="'+index+'" maxlength="300">'+esc(item.action)+'</textarea></label>';
    var summary='<p>'+esc(item.description)+'</p><small><b>ทีมต้องทำ:</b> '+esc(item.action)+'</small>';
    var editAction=editing?'<div class="rb-fb-guide-card-actions"><button type="button" data-guide-action="edit-text" data-guide-index="'+index+'">'+(guideTextOpen[index]?'✓ เสร็จแล้ว':'✎ แก้ไขข้อความ')+'</button></div>':'';
    var content=editing&&guideTextOpen[index]?fields:summary;
    return'<article class="rb-fb-guide-card'+(editing?' is-editing':'')+(guideTextOpen[index]?' is-text-editing':'')+'" data-follow="'+(item.follow?'1':'0')+'" data-search="'+esc((item.value+' '+item.description+' '+item.action).toLowerCase())+'"><div class="rb-fb-guide-card-head">'+badgeForItem(item)+control+'</div>'+content+editAction+'</article>';
  }).join('');
}
function updatedText(){if(!catalogMeta.updatedAt)return'ใช้ค่ามาตรฐานของระบบ';var date=new Date(Number(catalogMeta.updatedAt));return'แก้ไขล่าสุด '+date.toLocaleString('th-TH')+(catalogMeta.updatedBy?' โดย '+catalogMeta.updatedBy:'');}
function guideHtml(){
  var editButton=canEditGuide()?'<button class="rb-fb-guide-admin-btn" data-guide-action="edit" type="button">✎ แก้ไขคู่มือ · Supervisor</button>':'';
  return'<div id="rb-fb-status-guide" class="rb-fb-guide-overlay" role="dialog" aria-modal="true" aria-labelledby="rb-fb-guide-title"><section class="rb-fb-guide-modal"><header><div><h2 id="rb-fb-guide-title">คู่มือสถานะ Facebook</h2><p>อิงรายการสถานะจากชีตต้นทางและขั้นตอนการติดตามของทีม</p></div><div class="rb-fb-guide-head-actions">'+editButton+'<button class="rb-fb-guide-close" type="button" aria-label="ปิด" data-guide-action="close">×</button></div></header><div class="rb-fb-guide-toolbar"><input id="rb-fb-guide-search" type="search" placeholder="ค้นหาสถานะหรือวิธีแก้"><div><button class="is-active" data-guide-filter="all" type="button">ทั้งหมด</button><button data-guide-filter="follow" type="button">ต้องติดตาม</button><button data-guide-filter="safe" type="button">ไม่ต้องติดตาม</button></div></div><div class="rb-fb-guide-sync"><span>'+esc(updatedText())+'</span><span>พนักงานและ Specialist อ่านได้เท่านั้น</span></div><div class="rb-fb-guide-admin-note" id="rb-fb-guide-admin-note" hidden><b>โหมดแก้ไขสำหรับ Supervisor</b><span>การเปลี่ยน “ต้องติดตาม” จะมีผลต่อคิวตรวจออดิตของทุกคนหลังบันทึก</span></div><div class="rb-fb-guide-legend"><span><i class="is-follow"></i>บัญชีที่ทีมต้องดำเนินการ</span><span><i class="is-safe"></i>บัญชีที่ไม่ต้องเข้าคิวติดตาม</span></div><div id="rb-fb-guide-list" class="rb-fb-guide-list">'+guideCards()+'</div><footer id="rb-fb-guide-footer" hidden><span id="rb-fb-guide-save-status">ยังไม่มีการเปลี่ยนแปลง</span><div><button type="button" class="rb-fb-guide-cancel" data-guide-action="cancel">ยกเลิก</button><button type="button" class="rb-fb-guide-save" data-guide-action="save" disabled>✓ บันทึกการเปลี่ยนแปลง</button></div></footer></section></div>';
}
function filterGuide(){var root=document.getElementById('rb-fb-status-guide');if(!root)return;var query=String((document.getElementById('rb-fb-guide-search')||{}).value||'').trim().toLowerCase(),active=root.querySelector('[data-guide-filter].is-active'),filter=active?active.getAttribute('data-guide-filter'):'all';root.querySelectorAll('.rb-fb-guide-card').forEach(function(card){var matchText=!query||String(card.getAttribute('data-search')||'').indexOf(query)!==-1,matchType=filter==='all'||(filter==='follow'&&card.getAttribute('data-follow')==='1')||(filter==='safe'&&card.getAttribute('data-follow')==='0');card.hidden=!(matchText&&matchType);});}
function renderGuideCards(){var list=document.getElementById('rb-fb-guide-list');if(list)list.innerHTML=guideCards();filterGuide();}
function setGuideDirty(){guideDirty=true;var root=document.getElementById('rb-fb-status-guide'),save=root&&root.querySelector('[data-guide-action="save"]'),status=document.getElementById('rb-fb-guide-save-status');if(save)save.disabled=false;if(status)status.textContent='มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก';}
function enterGuideEdit(){if(!canEditGuide()||guideDraft)return;guideDraft=CATALOG.map(function(item){return Object.assign({},item);});guideDirty=false;guideTextOpen={};var root=document.getElementById('rb-fb-status-guide');if(!root)return;root.classList.add('is-admin-edit');var button=root.querySelector('[data-guide-action="edit"]');if(button){button.textContent='กำลังแก้ไข';button.disabled=true;}var note=document.getElementById('rb-fb-guide-admin-note'),footer=document.getElementById('rb-fb-guide-footer');if(note)note.hidden=false;if(footer)footer.hidden=false;renderGuideCards();}
function cancelGuideEdit(){if(guideSaving)return;if(guideDirty&&!window.confirm('ยกเลิกการแก้ไขที่ยังไม่ได้บันทึกใช่ไหม?'))return;guideDraft=null;guideDirty=false;guideTextOpen={};var root=document.getElementById('rb-fb-status-guide');if(!root)return;root.classList.remove('is-admin-edit');var button=root.querySelector('[data-guide-action="edit"]');if(button){button.textContent='✎ แก้ไขคู่มือ · Supervisor';button.disabled=false;}var note=document.getElementById('rb-fb-guide-admin-note'),footer=document.getElementById('rb-fb-guide-footer');if(note)note.hidden=true;if(footer)footer.hidden=true;renderGuideCards();}
function saveGuide(){
  if(!canEditGuide()||!guideDraft||!guideDirty||guideSaving)return;
  if(!window.confirm('ยืนยันการบันทึกคู่มือใหม่? การจัดประเภทต้องติดตามจะมีผลต่อคิวตรวจออดิตของทีม'))return;
  var root=document.getElementById('rb-fb-status-guide'),button=root&&root.querySelector('[data-guide-action="save"]'),status=document.getElementById('rb-fb-guide-save-status');
  guideSaving=true;if(button){button.disabled=true;button.textContent='กำลังบันทึก...';}if(status)status.textContent='กำลังบันทึกออนไลน์';
  var payload={items:normalizeCatalog(guideDraft),updatedAt:Date.now(),updatedBy:cleanText(window._rbUser&&window._rbUser.name||'Supervisor',80),version:1};
  var write=typeof window.fbSet==='function'?window.fbSet(CLOUD_PATH,payload):Promise.resolve(false);
  Promise.resolve(write).then(function(ok){if(ok===false)throw new Error('บันทึกออนไลน์ไม่สำเร็จ');applyCatalog(payload.items,payload);guideDraft=null;guideDirty=false;guideSaving=false;guideTextOpen={};if(root){root.classList.remove('is-admin-edit');var edit=root.querySelector('[data-guide-action="edit"]');if(edit){edit.textContent='✎ แก้ไขคู่มือ · Supervisor';edit.disabled=false;}var note=document.getElementById('rb-fb-guide-admin-note'),footer=document.getElementById('rb-fb-guide-footer'),sync=root.querySelector('.rb-fb-guide-sync span');if(note)note.hidden=true;if(footer)footer.hidden=true;if(sync)sync.textContent=updatedText();renderGuideCards();}if(window.fbSetSyncState)window.fbSetSyncState('saved','บันทึกคู่มือแล้ว');}).catch(function(error){guideSaving=false;if(button){button.disabled=false;button.textContent='✓ ลองบันทึกอีกครั้ง';}if(status){status.textContent=error&&error.message?error.message:'บันทึกไม่สำเร็จ';status.classList.add('is-error');}});
}
window.rbOpenFacebookStatusGuide=function(){var existing=document.getElementById('rb-fb-status-guide');if(existing){existing.classList.add('is-open');return;}guideDraft=null;guideDirty=false;guideTextOpen={};document.body.insertAdjacentHTML('beforeend',guideHtml());var root=document.getElementById('rb-fb-status-guide');root.addEventListener('click',function(event){if(event.target===root){window.rbCloseFacebookStatusGuide();return;}var filter=event.target.closest('[data-guide-filter]');if(filter){root.querySelectorAll('[data-guide-filter]').forEach(function(item){item.classList.toggle('is-active',item===filter);});filterGuide();return;}var action=event.target.closest('[data-guide-action]');if(!action)return;var name=action.getAttribute('data-guide-action');if(name==='close')window.rbCloseFacebookStatusGuide();else if(name==='edit')enterGuideEdit();else if(name==='cancel')cancelGuideEdit();else if(name==='save')saveGuide();else if(name==='edit-text'&&guideDraft){var index=Number(action.getAttribute('data-guide-index'));guideTextOpen[index]=!guideTextOpen[index];renderGuideCards();var area=root.querySelector('[data-guide-text="description"][data-guide-index="'+index+'"]');if(area)area.focus();}});root.addEventListener('change',function(event){var input=event.target.closest('[data-guide-follow]');if(!input||!guideDraft)return;var index=Number(input.getAttribute('data-guide-follow'));if(!guideDraft[index])return;guideDraft[index].follow=!!input.checked;var card=input.closest('.rb-fb-guide-card'),label=input.parentElement.querySelector('b');if(card)card.setAttribute('data-follow',input.checked?'1':'0');if(label)label.textContent=input.checked?'ต้องติดตาม':'ไม่ต้องติดตาม';setGuideDirty();filterGuide();});root.addEventListener('input',function(event){if(event.target.id==='rb-fb-guide-search'){filterGuide();return;}var field=event.target.getAttribute('data-guide-text'),index=Number(event.target.getAttribute('data-guide-index'));if(!field||!guideDraft||!guideDraft[index])return;guideDraft[index][field]=event.target.value;setGuideDirty();});requestAnimationFrame(function(){root.classList.add('is-open');});loadCloudCatalog(function(changed){if(changed&&!guideDraft&&document.getElementById('rb-fb-status-guide')){var sync=root.querySelector('.rb-fb-guide-sync span');if(sync)sync.textContent=updatedText();renderGuideCards();}});};
window.rbCloseFacebookStatusGuide=function(){if(guideSaving)return;if(guideDraft&&guideDirty&&!window.confirm('ปิดหน้าคู่มือและยกเลิกการแก้ไขที่ยังไม่ได้บันทึกใช่ไหม?'))return;guideDraft=null;guideDirty=false;guideTextOpen={};var root=document.getElementById('rb-fb-status-guide');if(root)root.remove();};
window.rbFacebookStatusCatalog=CATALOG;
window.rbFacebookStatusMeta=meta;
window.rbFacebookStatusNeedsFollowup=needsFollowup;
window.rbFacebookStatusValues=values;
window.rbSetFacebookStatusOptions=setSelect;
window.rbFacebookStatusBadge=badge;
window.rbUpdateFacebookStatusHelp=updateHelp;
window.rbReloadFacebookStatusCatalog=loadCloudCatalog;
window._rbFacebookStatusTest={catalog:CATALOG,meta:meta,needsFollowup:needsFollowup,values:values,normalizeCatalog:normalizeCatalog,canEditGuide:canEditGuide};
loadCachedCatalog();
if(typeof setTimeout==='function')setTimeout(function(){loadCloudCatalog();},0);
})();
