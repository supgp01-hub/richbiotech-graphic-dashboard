(function(window,document){
'use strict';

var READ_KEY='rb_notif_read_v2',lightbox=null,lightboxItems=[],lightboxIndex=0,lightboxContext={};
function escText(value){return String(value==null?'':value);}
function loadJson(key,fallback){try{var value=JSON.parse(localStorage.getItem(key)||'null');return value==null?fallback:value;}catch(error){return fallback;}}
function saveJson(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch(error){}}
function canonicalName(value){
  var raw=escText(value).trim().toLowerCase(),compact=raw.replace(/\s+/g,'');
  var aliases={view:'view','วิว':'view',moss:'moss','มอส':'moss',dom:'dom','ดอม':'dom',ter:'ter','เตอร์':'ter',nune:'nune','นุ่น':'nune',jam:'jam','แจ๋ม':'jam',ball:'ball','บอล':'ball',nui:'nui','นุ้ย':'nui',mind:'mind','มายด์':'mind'};
  return aliases[compact]||compact;
}
function currentUser(){return window._rbUser||{};}
function assignedTo(order,user){return canonicalName(order&&order.assignee)===canonicalName(user&&user.name);}
function statusLabel(type){var labels={new_order:'งานใหม่',status:'สถานะเปลี่ยน',deadline:'Deadline ใกล้',done:'เสร็จแล้ว',revision:'ต้องแก้ไข',review:'รอตรวจ'};return labels[type]||type;}
function noticeTone(type){return type==='revision'||type==='deadline'?'danger':type==='review'?'info':'task';}
function noticeId(order,type,version){return'order:'+escText(order.id)+':'+type+':'+(version||0)+':'+(order.updatedAt||0);}
function orderNotices(){
  var user=currentUser(),role=user.role||'',orders=typeof window.lpORD==='function'?window.lpORD():[],out=[],now=Date.now(),day=86400000,manager=role==='sup'||role==='spec';
  (orders||[]).forEach(function(order){
    if(!order||!order.id)return;var mine=assignedTo(order,user);
    if(order.status==='pending'&&(mine||manager))out.push({id:noticeId(order,'new_order'),type:'new_order',title:order.id+' · งานใหม่',desc:order.name||order.title||'',oid:order.id,tab:'info',ts:order.updatedAt||order.createdAt||now});
    if(order.status==='revision'&&(mine||manager)){
      var issues=Array.isArray(order.auditVersions)?order.auditVersions.filter(function(item){return item&&item.result==='issue'&&!item.employeeSubmittedAt;}):[];
      if(issues.length)issues.forEach(function(item,index){var version=Number(item.version)||index+1;out.push({id:noticeId(order,'revision',version),type:'revision',title:order.id+' · ต้องแก้ไข VER '+version,desc:item.note||item.issueType||order.name||order.title||'',oid:order.id,tab:'imgs',version:version,ts:item.correctionRequestedAt||item.updatedAt||order.updatedAt||now});});
      else out.push({id:noticeId(order,'revision'),type:'revision',title:order.id+' · งานถูกส่งกลับให้แก้ไข',desc:order.name||order.title||'',oid:order.id,tab:'imgs',ts:order.updatedAt||now});
    }
    if(order.status==='review'&&(role==='audit'||manager))out.push({id:noticeId(order,'review'),type:'review',title:order.id+' · รอตรวจงาน',desc:order.name||order.title||'',oid:order.id,tab:'links',ts:order.updatedAt||now});
    var deadline=order.deadline||order.dl||'',due=deadline?new Date(deadline).getTime():0;if(due&&order.status!=='done'&&due>=now&&due-now<day&&(mine||manager))out.push({id:noticeId(order,'deadline'),type:'deadline',title:order.id+' · ใกล้ Deadline',desc:order.name||order.title||'',oid:order.id,tab:order.status==='revision'?'imgs':'info',ts:order.updatedAt||now});
  });
  return out;
}
function allNotices(){
  var stored=loadJson('rb_notifs',[]);if(!Array.isArray(stored))stored=[];var derived=orderNotices(),seen={};
  return derived.concat(stored).filter(function(item){var key=item&&item.id||[item&&item.oid,item&&item.type,item&&item.title].join(':');if(!item||seen[key])return false;seen[key]=1;return true;}).sort(function(a,b){return Number(b.ts||0)-Number(a.ts||0);}).slice(0,80);
}
function readMap(){var map=loadJson(READ_KEY,{});return map&&typeof map==='object'&&!Array.isArray(map)?map:{};}
function isRead(notice,map){return !!(notice.read||map[notice.id]);}
function updateBadge(){var map=readMap(),count=allNotices().filter(function(item){return !isRead(item,map);}).length,badge=document.getElementById('rb-bell-badge');if(badge){badge.textContent=count?String(count):'';badge.style.display=count?'flex':'none';}}
function notificationList(){return document.getElementById('rb-notif-list')||document.getElementById('rb-notif-body');}
function markRead(id){var map=readMap();map[id]=Date.now();saveJson(READ_KEY,map);var stored=loadJson('rb_notifs',[]);if(Array.isArray(stored)){stored.forEach(function(item){if(item&&item.id===id)item.read=true;});saveJson('rb_notifs',stored);}updateBadge();}
function openNotice(notice){
  markRead(notice.id);var panel=document.getElementById('rb-notif-panel');if(panel)panel.style.display='none';
  if(!notice.oid)return;
  var tab=notice.tab||(notice.type==='revision'?'imgs':notice.type==='review'?'links':'info');
  if(typeof window.rbOpenOrderDestination==='function')window.rbOpenOrderDestination(notice.oid,tab,notice.version||0);
  else if(typeof window.openOM==='function')window.openOM(notice.oid);
}
function renderNotifications(tab){
  tab=tab||window._rbNTab||'all';var list=notificationList();if(!list)return;var map=readMap(),items=allNotices();
  if(tab==='unread')items=items.filter(function(item){return !isRead(item,map);});else if(tab==='work'||tab==='task')items=items.filter(function(item){return !!item.oid;});
  list.innerHTML='';
  if(!items.length){var empty=document.createElement('div');empty.className='rbn-empty';empty.textContent='ไม่มีการแจ้งเตือน';list.appendChild(empty);return;}
  items.forEach(function(item){
    var button=document.createElement('button');button.type='button';button.className='rbn-item rbn-item-button tone-'+noticeTone(item.type)+(isRead(item,map)?'':' rbn-unread');
    var dot=document.createElement('span');dot.className='rbn-dot';dot.setAttribute('aria-hidden','true');
    var body=document.createElement('span');body.className='rbn-body';var tag=document.createElement('span');tag.className='rbn-ntag';tag.textContent=statusLabel(item.type);var title=document.createElement('strong');title.className='rbn-ntitle';title.textContent=escText(item.title);var desc=document.createElement('span');desc.className='rbn-ndesc';desc.textContent=escText(item.desc);var time=document.createElement('time');time.className='rbn-ntime';time.textContent=new Date(item.ts||Date.now()).toLocaleString('th-TH');body.append(tag,title,desc,time);button.append(dot,body);
    if(item.oid){var go=document.createElement('span');go.className='rbn-go';go.textContent='เปิดงาน →';body.appendChild(go);}
    button.onclick=function(){openNotice(item);};list.appendChild(button);
  });
}
window._rbTogNotif=function(){var panel=document.getElementById('rb-notif-panel');if(!panel)return;var open=getComputedStyle(panel).display!=='none';panel.style.display=open?'none':'flex';if(!open)renderNotifications(window._rbNTab||'all');};
window._rbReadN=function(id){markRead(id);renderNotifications(window._rbNTab||'all');};
window._rbReadAll=function(){var map=readMap();allNotices().forEach(function(item){map[item.id]=Date.now();});saveJson(READ_KEY,map);var stored=loadJson('rb_notifs',[]);if(Array.isArray(stored)){stored.forEach(function(item){item.read=true;});saveJson('rb_notifs',stored);}updateBadge();renderNotifications(window._rbNTab||'all');};
window._rbSetNotifTab=function(tab,element){window._rbNTab=tab;document.querySelectorAll('.rbn-tab').forEach(function(button){button.classList.toggle('rbn-tab-active',button===element);});renderNotifications(tab);};
window.rbRefreshOrderNotifications=function(){updateBadge();var panel=document.getElementById('rb-notif-panel');if(panel&&getComputedStyle(panel).display!=='none')renderNotifications(window._rbNTab||'all');};

function normalizedImage(item,index){if(typeof item==='string')return{data:item,name:'รูปที่ '+(index+1)};return item&&item.data?item:{data:'',name:'รูปที่ '+(index+1)};}
function ensureLightbox(){
  if(lightbox)return lightbox;lightbox=document.createElement('div');lightbox.id='rb-evidence-lightbox';lightbox.hidden=true;lightbox.innerHTML='<section class="rb-el-dialog" role="dialog" aria-modal="true" aria-label="ดูรูปหลักฐานขนาดใหญ่"><div class="rb-el-stage"><button class="rb-el-close" type="button" aria-label="ปิด">×</button><button class="rb-el-nav rb-el-prev" type="button" aria-label="รูปก่อนหน้า">‹</button><div class="rb-el-image-scroll"><img class="rb-el-image" alt=""></div><button class="rb-el-nav rb-el-next" type="button" aria-label="รูปถัดไป">›</button><div class="rb-el-toolbar"><button class="rb-el-zoom" type="button">ขยาย 100%</button><span class="rb-el-position"></span></div></div><aside class="rb-el-meta"><h3 class="rb-el-source"></h3><p class="rb-el-job"></p><dl><div><dt>ชื่อไฟล์</dt><dd class="rb-el-name"></dd></div><div><dt>ผู้แนบ</dt><dd class="rb-el-by"></dd></div><div><dt>เวลาที่แนบ</dt><dd class="rb-el-at"></dd></div></dl><div class="rb-el-thumbs"></div></aside></section>';
  document.body.appendChild(lightbox);lightbox.addEventListener('click',function(event){if(event.target===lightbox)closeLightbox();});lightbox.querySelector('.rb-el-close').onclick=closeLightbox;lightbox.querySelector('.rb-el-prev').onclick=function(){showLightbox(lightboxIndex-1);};lightbox.querySelector('.rb-el-next').onclick=function(){showLightbox(lightboxIndex+1);};lightbox.querySelector('.rb-el-zoom').onclick=function(){var image=lightbox.querySelector('.rb-el-image'),zoomed=image.classList.toggle('is-zoomed');this.textContent=zoomed?'ย่อให้พอดี':'ขยาย 100%';};return lightbox;
}
function showLightbox(index){
  ensureLightbox();if(!lightboxItems.length)return;lightboxIndex=(index+lightboxItems.length)%lightboxItems.length;var item=normalizedImage(lightboxItems[lightboxIndex],lightboxIndex),image=lightbox.querySelector('.rb-el-image');image.classList.remove('is-zoomed');image.src=item.data;image.alt=item.name||('หลักฐานรูปที่ '+(lightboxIndex+1));lightbox.querySelector('.rb-el-zoom').textContent='ขยาย 100%';lightbox.querySelector('.rb-el-position').textContent=(lightboxIndex+1)+' / '+lightboxItems.length;lightbox.querySelector('.rb-el-source').textContent=lightboxContext.source||'รูปหลักฐาน';lightbox.querySelector('.rb-el-job').textContent=[lightboxContext.jobId,lightboxContext.version?'VER '+lightboxContext.version:''].filter(Boolean).join(' · ');lightbox.querySelector('.rb-el-name').textContent=item.name||'ไม่ระบุ';lightbox.querySelector('.rb-el-by').textContent=item.by||'ไม่ระบุ';lightbox.querySelector('.rb-el-at').textContent=item.at?new Date(item.at).toLocaleString('th-TH'):'ไม่ระบุ';var thumbs=lightbox.querySelector('.rb-el-thumbs');thumbs.innerHTML='';lightboxItems.forEach(function(raw,i){var current=normalizedImage(raw,i),button=document.createElement('button');button.type='button';button.className=i===lightboxIndex?'is-active':'';button.setAttribute('aria-label','เปิดรูปที่ '+(i+1));var thumb=document.createElement('img');thumb.src=current.data;thumb.alt='';button.appendChild(thumb);button.onclick=function(){showLightbox(i);};thumbs.appendChild(button);});lightbox.querySelector('.rb-el-prev').hidden=lightboxItems.length<2;lightbox.querySelector('.rb-el-next').hidden=lightboxItems.length<2;
}
function closeLightbox(){if(!lightbox)return;lightbox.hidden=true;document.body.classList.remove('rb-lightbox-open');}
window.rbOpenEvidenceLightbox=function(items,index,context){lightboxItems=(Array.isArray(items)?items:[]).filter(function(item){return !!normalizedImage(item,0).data;});if(!lightboxItems.length)return;lightboxContext=context||{};ensureLightbox();lightbox.hidden=false;document.body.classList.add('rb-lightbox-open');showLightbox(Number(index)||0);lightbox.querySelector('.rb-el-close').focus();};
document.addEventListener('keydown',function(event){if(!lightbox||lightbox.hidden)return;if(event.key==='Escape')closeLightbox();if(event.key==='ArrowLeft')showLightbox(lightboxIndex-1);if(event.key==='ArrowRight')showLightbox(lightboxIndex+1);});
window.addEventListener('storage',function(event){if(event.key==='rb_orders_v1'||event.key==='rb_notifs'||event.key===READ_KEY)window.rbRefreshOrderNotifications();});
setTimeout(window.rbRefreshOrderNotifications,900);
})(window,document);
