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

function esc(value){return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function norm(value){return String(value||'').trim().toLowerCase().replace(/\s+/g,'');}
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
function guideCards(){return CATALOG.map(function(item){return'<article class="rb-fb-guide-card" data-follow="'+(item.follow?'1':'0')+'" data-search="'+esc((item.value+' '+item.description+' '+item.action).toLowerCase())+'"><div class="rb-fb-guide-card-head">'+badge(item.value)+'<span class="rb-fb-follow-label '+(item.follow?'is-follow':'is-safe')+'">'+(item.follow?'ต้องติดตาม':'ไม่ต้องติดตาม')+'</span></div><p>'+esc(item.description)+'</p><small><b>ทีมต้องทำ:</b> '+esc(item.action)+'</small></article>';}).join('');}
function guideHtml(){return'<div id="rb-fb-status-guide" class="rb-fb-guide-overlay" role="dialog" aria-modal="true" aria-labelledby="rb-fb-guide-title"><section class="rb-fb-guide-modal"><header><div><h2 id="rb-fb-guide-title">คู่มือสถานะ Facebook</h2><p>อิงรายการสถานะจากชีตต้นทางและขั้นตอนการติดตามของทีม</p></div><button type="button" aria-label="ปิด" onclick="window.rbCloseFacebookStatusGuide()">×</button></header><div class="rb-fb-guide-toolbar"><input id="rb-fb-guide-search" type="search" placeholder="ค้นหาสถานะหรือวิธีแก้"><div><button class="is-active" data-guide-filter="all" type="button">ทั้งหมด</button><button data-guide-filter="follow" type="button">ต้องติดตาม</button><button data-guide-filter="safe" type="button">ไม่ต้องติดตาม</button></div></div><div class="rb-fb-guide-legend"><span><i class="is-follow"></i>บัญชีที่ทีมต้องดำเนินการ</span><span><i class="is-safe"></i>บัญชีที่ไม่ต้องเข้าคิวติดตาม</span></div><div id="rb-fb-guide-list" class="rb-fb-guide-list">'+guideCards()+'</div></section></div>';}
function filterGuide(){var root=document.getElementById('rb-fb-status-guide');if(!root)return;var query=String((document.getElementById('rb-fb-guide-search')||{}).value||'').trim().toLowerCase(),active=root.querySelector('[data-guide-filter].is-active'),filter=active?active.getAttribute('data-guide-filter'):'all';root.querySelectorAll('.rb-fb-guide-card').forEach(function(card){var matchText=!query||String(card.getAttribute('data-search')||'').indexOf(query)!==-1,matchType=filter==='all'||(filter==='follow'&&card.getAttribute('data-follow')==='1')||(filter==='safe'&&card.getAttribute('data-follow')==='0');card.hidden=!(matchText&&matchType);});}
window.rbOpenFacebookStatusGuide=function(){var existing=document.getElementById('rb-fb-status-guide');if(existing){existing.classList.add('is-open');return;}document.body.insertAdjacentHTML('beforeend',guideHtml());var root=document.getElementById('rb-fb-status-guide');root.addEventListener('click',function(event){if(event.target===root){window.rbCloseFacebookStatusGuide();return;}var button=event.target.closest('[data-guide-filter]');if(button){root.querySelectorAll('[data-guide-filter]').forEach(function(item){item.classList.toggle('is-active',item===button);});filterGuide();}});document.getElementById('rb-fb-guide-search').addEventListener('input',filterGuide);requestAnimationFrame(function(){root.classList.add('is-open');});};
window.rbCloseFacebookStatusGuide=function(){var root=document.getElementById('rb-fb-status-guide');if(root)root.remove();};
window.rbFacebookStatusCatalog=CATALOG;
window.rbFacebookStatusMeta=meta;
window.rbFacebookStatusNeedsFollowup=needsFollowup;
window.rbFacebookStatusValues=values;
window.rbSetFacebookStatusOptions=setSelect;
window.rbFacebookStatusBadge=badge;
window.rbUpdateFacebookStatusHelp=updateHelp;
window._rbFacebookStatusTest={catalog:CATALOG,meta:meta,needsFollowup:needsFollowup,values:values};
})();
