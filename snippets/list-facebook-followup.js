(function(){
'use strict';
if(window._lfbFollowupHybridLoaded)return;
window._lfbFollowupHybridLoaded=true;

var FOLLOW_LOCAL_KEY='rb_listfacebook_followups_v1';
var FOLLOW_CLOUD_PATH='/listfacebook_followups';
var PAGE_SIZES=[50,100,200];
var legacyInit=window._lfbInit;
var legacyActivate=window._lfbEditorActivate;
var followups=readLocal();
var selectedKey='';
var syncPromise=null;
var credentialsOpen=false;
var credentialsEditing=false;

function esc(value){
  return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function readLocal(){
  try{var value=JSON.parse(localStorage.getItem(FOLLOW_LOCAL_KEY)||'{}');return value&&typeof value==='object'?value:{};}catch(error){return{};}
}
function saveLocal(){
  try{localStorage.setItem(FOLLOW_LOCAL_KEY,JSON.stringify(followups));}catch(error){}
}
function listPageSize(){
  var value=window._lfbFilter&&window._lfbFilter.pageSize;
  if(PAGE_SIZES.indexOf(Number(value))>=0)return Number(value);
  if(window.rbPageSizeGet)value=window.rbPageSizeGet('listfb');
  else try{value=(JSON.parse(localStorage.getItem('rb_page_sizes_v1')||'{}')||{}).listfb;}catch(error){value=50;}
  return PAGE_SIZES.indexOf(Number(value))>=0?Number(value):50;
}
function saveListPageSize(value){
  value=PAGE_SIZES.indexOf(Number(value))>=0?Number(value):50;
  if(window.rbPageSizeSet)window.rbPageSizeSet('listfb',value);
  else try{var all=JSON.parse(localStorage.getItem('rb_page_sizes_v1')||'{}');all.listfb=value;localStorage.setItem('rb_page_sizes_v1',JSON.stringify(all));}catch(error){}
  return value;
}
function objectMap(value){
  if(!value)return{};
  if(Array.isArray(value)){var mapped={};value.forEach(function(item){if(item&&item.key)mapped[item.key]=item;});return mapped;}
  return typeof value==='object'?value:{};
}
function currentUser(){return window._rbUser&&window._rbUser.name?window._rbUser.name:'';}
function rowByKey(key){return(window._listfbData||[]).find(function(row){return row&&row._key===key;})||null;}
function isMarked(row){return !!String(row&&row.follow||'').trim();}
function needsSystemFollowup(row){
  var status=String(row&&row.st||'').trim();
  if(!status)return false;
  if(window.rbFacebookStatusMeta&&window.rbFacebookStatusMeta(status))return window.rbFacebookStatusNeedsFollowup(status);
  return ['ใช้งาน','ว่าง','ปิดใช้งาน','เปลี่ยนเฟสใหม่แล้ว'].indexOf(status)===-1;
}
function rowMeta(row){
  var saved=followups[row._key]||{};
  var marked=isMarked(row),recommended=!marked&&needsSystemFollowup(row);
  return{saved:saved,marked:marked,recommended:recommended,stage:saved.stage||(marked?'new':recommended?'suggested':'none')};
}
function stageLabel(stage){return{new:'ยังไม่เริ่ม',working:'กำลังแก้',waiting:'รอ Facebook',done:'แก้แล้ว',suggested:'ระบบแนะนำ'}[stage]||'ไม่ติดตาม';}
function stageClass(stage){return{new:'new',working:'working',waiting:'waiting',done:'done',suggested:'suggested'}[stage]||'none';}
function sourceLabel(row,meta){return meta.marked?'จากคอลัมน์ติดตาม':meta.recommended?'ระบบแนะนำ':'ประวัติการติดตาม';}
function issueReason(row,meta){
  if(meta.saved.reason)return meta.saved.reason;
  if(meta.recommended)return'สถานะ “'+String(row.st||'ไม่ระบุ')+'” มีปัญหา แต่ยังไม่ได้มาร์คในคอลัมน์ติดตาม';
  return'Sถานะ “'+String(row.st||'ไม่ระบุ')+'” ต้องดำเนินการก่อนบัญชีจะกลับมาใช้งานได้';
}
function stageCounts(data){
  var counts={new:0,working:0,waiting:0,done:0,marked:0,recommended:0};
  data.forEach(function(row){var meta=rowMeta(row);if(meta.marked)counts.marked++;if(meta.recommended&&!meta.saved.stage)counts.recommended++;if(counts[meta.stage]!=null)counts[meta.stage]++;});
  return counts;
}
function canEditFollowup(){return !!window._rbUser;}
function ownerOptions(current){
  var names=['View','Moss','Dom','Ter','Nune','Jam','Ball','Nui','Mind','ยังไม่มอบหมาย'];
  if(current&&names.indexOf(current)===-1)names.unshift(current);
  return names.map(function(name){return'<option value="'+esc(name)+'"'+(name===current?' selected':'')+'>'+esc(name)+'</option>';}).join('');
}
function stageOptions(current){
  return[['new','ยังไม่เริ่ม'],['working','กำลังแก้'],['waiting','รอ Facebook'],['done','แก้แล้ว']].map(function(pair){return'<option value="'+pair[0]+'"'+(pair[0]===current?' selected':'')+'>'+pair[1]+'</option>';}).join('');
}
function accountField(label,key,type,wide){
  type=type||'input';
  var control=type==='select'?'<select id="lfbi-'+key+'"></select>':type==='textarea'?'<textarea id="lfbi-'+key+'"></textarea>':'<input id="lfbi-'+key+'" type="text" autocomplete="off">';
  return'<div class="lfb-account-field '+(wide==='full'?'lfb-account-field-full':'')+'"><label for="lfbi-'+key+'">'+label+'</label>'+control+'</div>';
}
function credentialReadRow(label,key,row){
  return'<div class="lfb-credential-read-row"><span>'+label+'</span><strong>'+esc(row[key]||'-')+'</strong></div>';
}
function inlineStatusHelp(value){
  var host=document.getElementById('lfbi-st-help');if(!host)return;
  var meta=window.rbFacebookStatusMeta?window.rbFacebookStatusMeta(value):null;
  host.className='lfb-account-status-help '+(meta?(meta.follow?'is-follow':'is-safe'):'is-unknown');
  host.innerHTML=meta?'<b>'+(meta.follow?'ต้องติดตาม':'ไม่ต้องติดตาม')+'</b><span>'+esc(meta.description)+' · '+esc(meta.action)+'</span>':'<b>สถานะจากข้อมูลเดิม</b><span>ยังไม่มีคำอธิบายในคู่มือ กรุณาตรวจสอบก่อนบันทึก</span>';
}
function formatWhen(timestamp){
  if(!timestamp)return'-';
  try{return new Date(timestamp).toLocaleString('th-TH',{dateStyle:'short',timeStyle:'short'});}catch(error){return'-';}
}
function accountUpdatedWhen(row){
  if(row&&row.updatedAt)return formatWhen(row.updatedAt);
  return String(row&&row.upd||'').trim()||'ยังไม่มีข้อมูล';
}
function dateValue(timestamp){
  var date=timestamp?new Date(timestamp):new Date();
  if(Number.isNaN(date.getTime()))date=new Date();
  function pad(value){return String(value).padStart(2,'0');}
  return date.getFullYear()+'-'+pad(date.getMonth()+1)+'-'+pad(date.getDate());
}
function addDaysValue(timestamp,days){
  var date=timestamp?new Date(timestamp):new Date();
  if(Number.isNaN(date.getTime()))date=new Date();
  date.setHours(12,0,0,0);date.setDate(date.getDate()+Number(days||0));
  return dateValue(date);
}
function dateAtMidnight(value){
  var match=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match?new Date(Number(match[1]),Number(match[2])-1,Number(match[3])).getTime():NaN;
}
function formatDateValue(value){
  var timestamp=dateAtMidnight(value);if(Number.isNaN(timestamp))return'-';
  return new Date(timestamp).toLocaleDateString('th-TH',{day:'2-digit',month:'2-digit',year:'numeric'});
}
function automaticNextDate(timestamp){return addDaysValue(timestamp||Date.now(),7);}
function defaultListView(){
  window._lfbFilter={stage:'new',followView:'all',fE:'ALL',fStatus:'ALL',q:'',page:1,pageSize:listPageSize()};
  selectedKey='';
  credentialsOpen=false;
  credentialsEditing=false;
}
function followupTiming(saved,now){
  saved=saved||{};now=now||Date.now();
  if(saved.stage==='done')return{level:0,className:'',daysLeft:null,nextDate:'',label:'เสร็จแล้ว'};
  if(!saved.updatedAt&&!saved.nextDate)return{level:0,className:'is-age-0',daysLeft:null,nextDate:'',label:'รอบันทึกครั้งแรก'};
  var nextDate=saved.nextDate||automaticNextDate(saved.updatedAt||now),today=dateAtMidnight(dateValue(now)),due=dateAtMidnight(nextDate);
  var daysLeft=Number.isNaN(due)?7:Math.max(0,Math.ceil((due-today)/86400000));
  var level=Math.max(0,Math.min(7,7-daysLeft));
  return{level:level,className:'is-age-'+level,daysLeft:daysLeft,nextDate:nextDate,label:daysLeft<=0?'ครบกำหนดติดตาม':daysLeft===1?'ติดตามพรุ่งนี้':'เหลือ '+daysLeft+' วัน'};
}
function hybridHtml(overlay){
  var html='';
  html+='<section class="lfb-hybrid-app">';
  html+='<header class="lfb-hybrid-head"><div class="lfb-hybrid-brand"><span class="lfb-hybrid-icon">☑</span><div><strong>ติดตามบัญชี Facebook</strong><small>คิวงานและรายละเอียดบัญชีในหน้าเดียว</small></div></div><div class="lfb-hybrid-head-actions"><span id="lfb2-ts">ใช้ข้อมูลที่บันทึกไว้</span><button class="lfb-editor-btn lfb-status-guide-btn" type="button" onclick="window.rbOpenFacebookStatusGuide()">? คู่มือสถานะ</button><button id="lfb2-upd" class="lfb-editor-btn" type="button">↻ อัปเดตข้อมูลล่าสุด</button><button id="lfb-add" class="lfb-editor-btn lfb-editor-btn-primary" type="button">＋ เพิ่มบัญชี</button></div></header>';
  html+='<div id="lfb-follow-source-warning" class="lfb-follow-source-warning" hidden>ข้อมูลเดิมยังไม่มีคอลัมน์ “ต้องติดตาม” · กดอัปเดตข้อมูลล่าสุด 1 ครั้งเพื่อดึงค่าจากชีต</div>';
  html+='<div id="lfb-follow-stats" class="lfb-follow-stats"></div>';
  html+='<div id="lfb-follow-stages" class="lfb-follow-stages"></div>';
  html+='<div class="lfb-hybrid-main"><section class="lfb-hybrid-list"><div class="lfb-hybrid-toolbar"><input id="lfb-q" type="search" placeholder="ค้นหาชื่อบัญชี / Facebook ID / สถานะ"><select id="lfb-hybrid-status" class="lfb-status-filter" aria-label="กรองสถานะ"><option value="ALL">สถานะทั้งหมด</option></select><select id="lfb-hybrid-employee" aria-label="กรองพนักงาน"><option value="ALL">พนักงานทั้งหมด</option></select><button id="lfb-filter-toggle" class="lfb-editor-btn" type="button" aria-expanded="false">ตัวกรอง</button></div><div id="lfb-advanced-filters" class="lfb-advanced-filters"><div class="lfb-filter-group"><span>มุมมอง</span><button type="button" class="lfb-hybrid-view-filter" data-view="stage">ตามขั้นตอน</button><button type="button" class="lfb-hybrid-view-filter" data-view="marked">ทีมมาร์คติดตาม</button><button type="button" class="lfb-hybrid-view-filter" data-view="recommended">ระบบแนะนำ</button><button type="button" class="lfb-hybrid-view-filter is-active" data-view="all" aria-pressed="true">บัญชีทั้งหมด</button></div></div><div id="lfb-cnt" class="lfb-result-note"></div><div class="lfb-hybrid-table-wrap"><table class="lfb-hybrid-table"><colgroup><col class="lfb-col-account"><col class="lfb-col-employee"><col class="lfb-col-status"><col class="lfb-col-stage"><col class="lfb-col-updated"></colgroup><thead><tr><th>ชื่อบัญชี</th><th class="lfb-table-center">พนักงาน</th><th class="lfb-table-center">สถานะ Facebook</th><th class="lfb-table-center">ขั้นตอน</th><th class="lfb-table-center">ติดตามครั้งถัดไป</th></tr></thead><tbody id="lfb-body"></tbody></table></div><div class="lfb-pager-row"><div id="lfb-pager"></div></div></section><aside id="lfb-account-detail" class="lfb-follow-detail lfb-account-detail"><div class="lfb-follow-empty">เลือกบัญชีเพื่อแก้ไขข้อมูล</div></aside></div>';
  html+='<div id="lfb-followup-overlay" class="lfb-followup-overlay" role="dialog" aria-modal="true" aria-labelledby="lfb-followup-title"><section class="lfb-followup-modal"><header><div><h3 id="lfb-followup-title">แก้ไขข้อมูลติดตาม</h3><p id="lfb-followup-subtitle">บันทึกขั้นตอน ผู้รับผิดชอบ และประวัติ</p></div><button type="button" class="lfb-followup-close" aria-label="ปิด">×</button></header><div id="lfb-followup-body" class="lfb-followup-body"></div></section></div>';
  html+='</section>';
  var root=document.getElementById('lfb-root');
  root.innerHTML=html;
  if(overlay)root.appendChild(overlay);
}
function employeeOptions(data){
  var select=document.getElementById('lfb-hybrid-employee');if(!select)return;
  var seen={},items=[];data.forEach(function(row){var value=String(row.emp||'').trim();if(!value)return;var key=value.toUpperCase();if(seen[key])return;seen[key]=true;items.push(value);});items.sort(function(a,b){return a.localeCompare(b,'en',{sensitivity:'base'});});
  var current=window._lfbFilter&&window._lfbFilter.fE||'ALL';
  select.innerHTML='<option value="ALL">พนักงานทั้งหมด</option>'+items.map(function(value){return'<option value="'+esc(value)+'">'+esc(value)+'</option>';}).join('')+'<option value="__EMPTY__">ไม่ระบุพนักงาน</option>';
  select.value=current;
}
function statusOptions(){var select=document.getElementById('lfb-hybrid-status');if(!select)return;var current=window._lfbFilter&&window._lfbFilter.fStatus||'ALL';if(window.rbSetFacebookStatusOptions)window.rbSetFacebookStatusOptions(select,current,true);select.value=current;}
function renderStats(data,counts){
  var host=document.getElementById('lfb-follow-stats');if(!host)return;
  var done=counts.done,view=window._lfbFilter&&window._lfbFilter.followView||'all';
  function card(name,classes,count,label){var active=view===name;return'<button type="button" class="lfb-follow-stat '+classes+(active?' is-active':'')+'" data-summary="'+name+'" aria-pressed="'+(active?'true':'false')+'"><strong>'+count+'</strong><span>'+label+'</span>'+(active?'<em>กำลังดู</em>':'')+'</button>';}
  host.innerHTML=card('all','',data.length,'บัญชีทั้งหมด')+card('marked','is-danger ',counts.marked,'ทีมมาร์ค “ติดตาม”')+card('recommended','is-warning ',counts.recommended,'ระบบแนะนำให้ตรวจ')+card('done','is-success ',done,'แก้สำเร็จ');
}
function renderStages(counts){
  var host=document.getElementById('lfb-follow-stages');if(!host)return;
  var filter=window._lfbFilter||{},current=filter.stage||'new',stageView=filter.followView==='stage';
  var stages=[['new','ต้องเริ่มแก้','รายการที่ทีมมาร์คไว้'],['working','กำลังแก้','มีผู้รับผิดชอบแล้ว'],['waiting','รอ Facebook','รอยืนยันหรือตรวจสอบ'],['done','แก้แล้ว','เก็บประวัติไว้']];
  host.innerHTML=stages.map(function(stage){var active=stageView&&stage[0]===current;return'<button type="button" class="lfb-follow-stage '+(active?'is-active':'')+'" data-stage="'+stage[0]+'" aria-pressed="'+(active?'true':'false')+'"><span><b>'+stage[1]+'</b><em>'+counts[stage[0]]+'</em></span><small>'+stage[2]+'</small></button>';}).join('');
}
function renderViewButtons(){
  var view=window._lfbFilter&&window._lfbFilter.followView||'all';
  document.querySelectorAll('#lfb-root .lfb-hybrid-view-filter').forEach(function(button){var active=button.getAttribute('data-view')===view;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',active?'true':'false');});
}
function filteredRows(data){
  var filter=window._lfbFilter||{},query=String(filter.q||'').trim().toLowerCase();
  return data.filter(function(row){
    var meta=rowMeta(row),view=filter.followView||'all';
    if(query)return [row.name,row.fbid,row.email,row.emp,row.st,row.note,meta.saved.note].join(' ').toLowerCase().indexOf(query)!==-1;
    if(filter.fStatus&&filter.fStatus!=='ALL'&&String(row.st||'')!==filter.fStatus)return false;
    if(view==='stage'&&meta.stage!==filter.stage)return false;
    if(view==='marked'&&!meta.marked)return false;
    if(view==='recommended'&&!(meta.recommended&&!meta.saved.stage))return false;
    if(view==='done'&&meta.stage!=='done')return false;
    if(filter.fE==='__EMPTY__'&&String(row.emp||'').trim())return false;
    if(filter.fE&&filter.fE!=='ALL'&&filter.fE!=='__EMPTY__'&&String(row.emp||'').toUpperCase()!==String(filter.fE).toUpperCase())return false;
    return true;
  }).sort(function(a,b){var ma=rowMeta(a),mb=rowMeta(b),ta=ma.saved.updatedAt||0,tb=mb.saved.updatedAt||0;if(ta!==tb)return tb-ta;return String(a.upd||'').localeCompare(String(b.upd||''));});
}
function renderRows(data){
  var filter=window._lfbFilter,size=listPageSize(),filtered=filteredRows(data),pages=Math.max(1,Math.ceil(filtered.length/size));filter.pageSize=size;filter.page=Math.max(1,Math.min(filter.page||1,pages));var start=(filter.page-1)*size,visible=filtered.slice(start,start+size);
  var body=document.getElementById('lfb-body');if(!body)return;
  body.innerHTML=visible.map(function(row){var meta=rowMeta(row),timing=followupTiming(meta.saved),status=window.rbFacebookStatusBadge?window.rbFacebookStatusBadge(row.st||'ยังไม่ระบุ'):esc(row.st||'ยังไม่ระบุ');return'<tr class="lfb-follow-row '+(selectedKey===row._key?'is-selected':'')+'" data-key="'+esc(row._key)+'"><td><button type="button" class="lfb-name-btn" data-key="'+esc(row._key)+'">'+esc(row.name||'-')+'</button><div class="lfb-follow-row-meta">'+esc(sourceLabel(row,meta))+(row.type?' · '+esc(row.type):'')+'</div></td><td class="lfb-table-center lfb-employee">'+esc(row.emp||'-')+'</td><td class="lfb-table-center lfb-status-cell">'+status+'</td><td class="lfb-table-center lfb-stage-cell"><span class="lfb-follow-badge is-'+stageClass(meta.stage)+' '+timing.className+'" title="'+esc(timing.label)+'">'+esc(stageLabel(meta.stage))+'</span></td><td class="lfb-table-center lfb-updated"><strong>'+esc(formatDateValue(timing.nextDate))+'</strong><small>'+esc(timing.label)+'</small></td></tr>';}).join('')||'<tr><td colspan="5" class="lfb-empty-row">ไม่พบรายการในมุมมองนี้</td></tr>';
  var count=document.getElementById('lfb-cnt');if(count)count.textContent=filtered.length?'แสดง '+(start+1)+'–'+Math.min(start+size,filtered.length)+' จาก '+filtered.length+' บัญชี':'0 ผลลัพธ์';
  var pager=document.getElementById('lfb-pager');if(pager)pager.className='rbps-pager';if(pager)pager.innerHTML=window.rbPageSizeMarkup?window.rbPageSizeMarkup('listfb',filtered.length,filter.page,size):'<button type="button" class="lfb-editor-btn" data-page="-1" '+(filter.page<=1?'disabled':'')+'>‹ ก่อนหน้า</button><span>หน้า '+filter.page+' / '+pages+'</span><button type="button" class="lfb-editor-btn" data-page="1" '+(filter.page>=pages?'disabled':'')+'>ถัดไป ›</button><select data-lfb-page-size><option value="50"'+(size===50?' selected':'')+'>50/หน้า</option><option value="100"'+(size===100?' selected':'')+'>100/หน้า</option><option value="200"'+(size===200?' selected':'')+'>200/หน้า</option></select>';
if((!selectedKey||!rowByKey(selectedKey))&&visible[0])selectedKey=visible[0]._key;
}
function renderAccountDetail(){
  var host=document.getElementById('lfb-account-detail');if(!host)return;
  var row=rowByKey(selectedKey);if(!row){host.innerHTML='<div class="lfb-follow-empty">เลือกบัญชีเพื่อแก้ไขข้อมูล</div>';return;}
  host.innerHTML='<div class="lfb-account-head"><div><h3>แก้ไขข้อมูลบัญชี</h3><p><span>'+esc(row.name||'-')+' · '+esc(row.emp||'ไม่ระบุพนักงาน')+'</span><time class="lfb-account-updated">แก้ไขล่าสุด: '+esc(accountUpdatedWhen(row))+'</time></p></div><div class="lfb-account-head-actions"><span>'+esc(row._source==='manual'?'เพิ่มในระบบ':'ข้อมูลจากชีต')+'</span><button type="button" id="lfb-credentials-open" class="lfb-editor-btn lfb-editor-btn-primary" aria-expanded="'+(credentialsOpen?'true':'false')+'">ดูข้อมูลเพิ่ม</button></div></div><section class="lfb-account-section"><strong>ข้อมูลบัญชี</strong><div class="lfb-account-grid">'+accountField('ประเภทบัญชี','type','select')+accountField('ชื่อบัญชี *','name','input','full')+accountField('พนักงาน','emp')+accountField('สินค้า','prod')+accountField('สถานะ','st','select','full')+'<div id="lfbi-st-help" class="lfb-account-status-help"></div>'+accountField('Facebook ID','fbid','input','full')+'</div></section><section class="lfb-account-section"><strong>การเงินและหมายเหตุ</strong><div class="lfb-account-grid">'+accountField('ลิมิต/วัน','limit')+accountField('ยอดเงิน','bal')+accountField('หมายเหตุ','note','textarea','full')+'</div></section><div class="lfb-account-actions"><span id="lfb-account-save-state" aria-live="polite"></span><button type="button" id="lfb-account-save" class="lfb-editor-btn lfb-editor-btn-primary">บันทึกข้อมูลบัญชี</button></div><aside id="lfb-credentials-drawer" class="lfb-credentials-drawer '+(credentialsOpen?'is-open':'')+'" aria-hidden="'+(credentialsOpen?'false':'true')+'"><header><div><strong>ข้อมูลเข้าสู่ระบบ</strong><small>แสดงข้อมูลเต็มตามสิทธิ์</small></div><div class="lfb-credentials-head-actions"><button type="button" id="lfb-credentials-edit" class="lfb-editor-btn">✎ แก้ไข</button><button type="button" id="lfb-credentials-close" class="lfb-editor-btn">ซ่อน</button></div></header><div class="lfb-credentials-read" '+(credentialsEditing?'hidden':'')+'>'+credentialReadRow('รหัสผ่าน Facebook','passFb',row)+credentialReadRow('Email','email',row)+credentialReadRow('รหัส Email','emailPass',row)+credentialReadRow('2FA','twofa',row)+'</div><div class="lfb-credentials-edit" '+(credentialsEditing?'':'hidden')+'><div class="lfb-account-grid">'+accountField('รหัสผ่าน Facebook','passFb','input','full')+accountField('Email','email','input','full')+accountField('รหัส Email','emailPass','input','full')+accountField('2FA','twofa','input','full')+'</div><div class="lfb-credentials-edit-actions"><span id="lfb-credentials-save-state" aria-live="polite"></span><button type="button" id="lfb-credentials-cancel" class="lfb-editor-btn">ยกเลิก</button><button type="button" id="lfb-credentials-save" class="lfb-editor-btn lfb-editor-btn-primary">บันทึกการแก้ไข</button></div></div></aside>';
  var typeSelect=document.getElementById('lfbi-type');if(typeSelect)typeSelect.innerHTML=['บัญชีเล็ก','บัญชีใหญ่'].concat(row.type&&['บัญชีเล็ก','บัญชีใหญ่'].indexOf(row.type)===-1?[row.type]:[]).map(function(value){return'<option value="'+esc(value)+'">'+esc(value)+'</option>';}).join('');
  var statusSelect=document.getElementById('lfbi-st');if(window.rbSetFacebookStatusOptions)window.rbSetFacebookStatusOptions(statusSelect,row.st,false);
  ['type','name','emp','prod','st','fbid','passFb','email','emailPass','twofa','limit','bal','note'].forEach(function(key){var element=document.getElementById('lfbi-'+key);if(element)element.value=row[key]||'';});
  ['passFb','email','emailPass','twofa'].forEach(function(key){var element=document.getElementById('lfbi-'+key);if(element)element.disabled=!credentialsEditing;});
  inlineStatusHelp(row.st);
}
function openCredentialsDrawer(editing){credentialsOpen=true;credentialsEditing=!!editing;renderAccountDetail();}
function closeCredentialsDrawer(){credentialsOpen=false;credentialsEditing=false;renderAccountDetail();}
function cancelCredentialsEdit(){credentialsEditing=false;renderAccountDetail();}
function renderFollowupModal(){
  var host=document.getElementById('lfb-followup-body'),row=rowByKey(selectedKey);if(!host||!row)return;
  var meta=rowMeta(row),saved=meta.saved,stage=meta.stage==='suggested'?'new':meta.stage,timing=followupTiming(saved),detailNextDate=stage==='done'?'':(timing.nextDate||automaticNextDate(Date.now())),history=Array.isArray(saved.history)?saved.history.slice(0,5):[];
  host.innerHTML='<div class="lfb-follow-detail-head"><div><h3>'+esc(row.name||'-')+'</h3><p>'+esc(row.emp||'ไม่ระบุพนักงาน')+' · อัปเดต '+esc(row.upd||'-')+'</p></div><span class="lfb-follow-source '+(meta.recommended&&!meta.saved.stage?'is-suggested':'')+'">'+esc(sourceLabel(row,meta))+'</span></div><div class="lfb-follow-reason">'+esc(issueReason(row,meta))+'</div><label class="lfb-follow-field"><span>ขั้นตอนติดตาม</span><select id="lfb-follow-stage-input" '+(canEditFollowup()?'':'disabled')+'>'+stageOptions(stage)+'</select></label><label class="lfb-follow-field"><span>ผู้รับผิดชอบแก้ไข</span><select id="lfb-follow-owner-input" '+(canEditFollowup()?'':'disabled')+'>'+ownerOptions(saved.owner||'ยังไม่มอบหมาย')+'</select></label><label class="lfb-follow-field"><span>ติดตามครั้งถัดไป <small>ระบบกำหนดให้อัตโนมัติ +7 วัน</small></span><input id="lfb-follow-date-input" type="date" value="'+esc(detailNextDate)+'" readonly></label><label class="lfb-follow-field"><span>บันทึกการแก้ไข</span><textarea id="lfb-follow-note-input" placeholder="บันทึกสิ่งที่ทำหรือสิ่งที่ต้องรอ" '+(canEditFollowup()?'':'disabled')+'>'+esc(saved.note||'')+'</textarea></label><div class="lfb-follow-history"><strong>ประวัติล่าสุด</strong>'+(history.length?history.map(function(event){return'<div class="lfb-follow-event"><b>'+esc(event.action||'อัปเดตการติดตาม')+'</b><span>'+esc(event.by||'-')+' · '+esc(formatWhen(event.at))+'</span></div>';}).join(''):'<div class="lfb-follow-no-history">ยังไม่มีประวัติการแก้ไข</div>')+'</div><div class="lfb-follow-detail-actions">'+(canEditFollowup()?'<button type="button" id="lfb-follow-save" class="lfb-editor-btn lfb-editor-btn-primary">บันทึกการติดตาม</button>':'')+'</div><div id="lfb-follow-save-state" class="lfb-follow-save-state" aria-live="polite"></div>';
}
function openFollowupModal(key){
  selectedKey=key;renderAll();renderFollowupModal();var overlay=document.getElementById('lfb-followup-overlay');if(overlay)overlay.classList.add('is-open');
}
function closeFollowupModal(){var overlay=document.getElementById('lfb-followup-overlay');if(overlay)overlay.classList.remove('is-open');}
function persistAccountDetail(reopenCredentials){
  var state=document.getElementById(reopenCredentials?'lfb-credentials-save-state':'lfb-account-save-state'),button=document.getElementById(reopenCredentials?'lfb-credentials-save':'lfb-account-save');if(!selectedKey||typeof window._lfbSaveAccountRecord!=='function')return;
  var values={};['type','name','emp','prod','st','fbid','passFb','email','emailPass','twofa','limit','bal','note'].forEach(function(key){var element=document.getElementById('lfbi-'+key);values[key]=element?element.value:'';});
  if(button)button.disabled=true;if(state)state.textContent='กำลังบันทึก...';
  window._lfbSaveAccountRecord(selectedKey,values).then(function(result){credentialsEditing=false;credentialsOpen=!!reopenCredentials;renderAll();var target=document.getElementById(reopenCredentials?'lfb-credentials-save-state':'lfb-account-save-state');if(target)target.textContent=result.online?'บันทึกและซิงก์เรียบร้อย':'บันทึกในเครื่องแล้ว · รอซิงก์ออนไลน์';}).catch(function(error){var target=document.getElementById(reopenCredentials?'lfb-credentials-save-state':'lfb-account-save-state');if(target)target.textContent=error&&error.message?error.message:'บันทึกไม่สำเร็จ';}).finally(function(){var target=document.getElementById(reopenCredentials?'lfb-credentials-save':'lfb-account-save');if(target)target.disabled=false;});
}
function renderAll(){
  var data=window._listfbData||[];
  if(!window._lfbFilter)window._lfbFilter={};
  var filter=window._lfbFilter;if(!filter.stage)filter.stage='new';if(!filter.followView)filter.followView='all';if(!filter.fE)filter.fE='ALL';if(!filter.page)filter.page=1;if(!filter.pageSize)filter.pageSize=listPageSize();
  var query=document.getElementById('lfb-q');if(query&&query.value!==String(filter.q||''))query.value=String(filter.q||'');
  var counts=stageCounts(data);employeeOptions(data);statusOptions();renderStats(data,counts);renderStages(counts);renderViewButtons();renderRows(data);renderAccountDetail();
  var warning=document.getElementById('lfb-follow-source-warning');if(warning)warning.hidden=!data.length||data.some(function(row){return Object.prototype.hasOwnProperty.call(row,'follow');});
}
function syncFollowups(){
  if(syncPromise)return syncPromise;
  syncPromise=new Promise(function(resolve){
    if(typeof window.fbGet!=='function'){resolve(false);return;}
    window.fbGet(FOLLOW_CLOUD_PATH,function(error,value){if(!error&&value){followups=Object.assign({},followups,objectMap(value));saveLocal();renderAll();resolve(true);}else resolve(false);});
  }).finally(function(){syncPromise=null;});
  return syncPromise;
}
function persistSelected(){
  var row=rowByKey(selectedKey),state=document.getElementById('lfb-follow-save-state');if(!row||!canEditFollowup())return;
  var stage=document.getElementById('lfb-follow-stage-input').value,owner=document.getElementById('lfb-follow-owner-input').value,nextDate=stage==='done'?'':automaticNextDate(Date.now()),note=document.getElementById('lfb-follow-note-input').value.trim(),previous=followups[selectedKey]||{},history=Array.isArray(previous.history)?previous.history.slice():[];
  history.unshift({action:'เปลี่ยนเป็น “'+stageLabel(stage)+'”',by:currentUser()||'ไม่ระบุ',at:Date.now()});history=history.slice(0,20);
  var entry={key:selectedKey,stage:stage,owner:owner,nextDate:nextDate,note:note,reason:issueReason(row,rowMeta(row)),updatedAt:Date.now(),updatedBy:currentUser(),history:history};
  followups[selectedKey]=entry;saveLocal();renderAll();renderFollowupModal();state=document.getElementById('lfb-follow-save-state');if(state)state.textContent='บันทึกในเครื่องแล้ว กำลังซิงก์...';
  var result=typeof window.fbSet==='function'?window.fbSet(FOLLOW_CLOUD_PATH+'/'+selectedKey,entry):Promise.resolve(false);
  Promise.resolve(result).then(function(ok){var target=document.getElementById('lfb-follow-save-state');if(target)target.textContent=ok===false?'บันทึกในเครื่องแล้ว · รอซิงก์ออนไลน์':'บันทึกและซิงก์เรียบร้อย';}).catch(function(){var target=document.getElementById('lfb-follow-save-state');if(target)target.textContent='บันทึกในเครื่องแล้ว · รอซิงก์ออนไลน์';});
}
function bindHybrid(root){
  root.addEventListener('click',function(event){
    var nameButton=event.target.closest('.lfb-name-btn');
    if(!nameButton)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openFollowupModal(nameButton.getAttribute('data-key'));
  },true);
  root.addEventListener('click',function(event){
    var stage=event.target.closest('.lfb-follow-stage');if(stage){window._lfbFilter.stage=stage.getAttribute('data-stage');window._lfbFilter.followView='stage';window._lfbFilter.page=1;renderAll();return;}
    var summary=event.target.closest('.lfb-follow-stat');if(summary){var view=summary.getAttribute('data-summary');window._lfbFilter.followView=view==='done'?'done':view;window._lfbFilter.page=1;renderAll();return;}
    var viewButton=event.target.closest('.lfb-hybrid-view-filter');if(viewButton){window._lfbFilter.followView=viewButton.getAttribute('data-view');window._lfbFilter.page=1;renderAll();return;}
    var row=event.target.closest('.lfb-follow-row');if(row&&!event.target.closest('.lfb-name-btn')){selectedKey=row.getAttribute('data-key');credentialsOpen=false;credentialsEditing=false;renderAll();return;}
    var directPage=event.target.closest('[data-rbps-page]');if(directPage){window._lfbFilter.page=Math.max(1,Number(directPage.getAttribute('data-rbps-page'))||1);renderAll();return;}
    var pager=event.target.closest('[data-page]');if(pager){window._lfbFilter.page+=Number(pager.getAttribute('data-page'))||0;renderAll();return;}
    if(event.target.closest('#lfb-follow-save')){persistSelected();return;}
    if(event.target.closest('#lfb-account-save')){persistAccountDetail();return;}
    if(event.target.closest('#lfb-credentials-open')){openCredentialsDrawer(false);return;}
    if(event.target.closest('#lfb-credentials-close')){closeCredentialsDrawer();return;}
    if(event.target.closest('#lfb-credentials-edit')){openCredentialsDrawer(true);return;}
    if(event.target.closest('#lfb-credentials-cancel')){cancelCredentialsEdit();return;}
    if(event.target.closest('#lfb-credentials-save')){persistAccountDetail(true);return;}
    if(event.target.closest('.lfb-followup-close')){closeFollowupModal();return;}
  });
  root.addEventListener('change',function(event){
    if(event.target&&event.target.id==='lfbi-st')inlineStatusHelp(event.target.value);
    if(event.target&&event.target.matches('[data-rbps-size],[data-lfb-page-size]')){window._lfbFilter.pageSize=saveListPageSize(event.target.value);window._lfbFilter.page=1;renderAll();}
  });
  var followOverlay=document.getElementById('lfb-followup-overlay');if(followOverlay)followOverlay.addEventListener('click',function(event){if(event.target===followOverlay)closeFollowupModal();});
  document.getElementById('lfb2-upd').addEventListener('click',function(){Promise.resolve(window._listfbFetch()).then(function(){syncFollowups();renderAll();});});
  document.getElementById('lfb-add').addEventListener('click',function(){window._lfbOpenEditor('');});
  document.getElementById('lfb-q').addEventListener('input',function(){window._lfbFilter.q=this.value;window._lfbFilter.page=1;selectedKey='';renderAll();});
  document.getElementById('lfb-hybrid-employee').addEventListener('change',function(){window._lfbFilter.fE=this.value;window._lfbFilter.page=1;renderAll();});
  document.getElementById('lfb-hybrid-status').addEventListener('change',function(){window._lfbFilter.fStatus=this.value;window._lfbFilter.page=1;renderAll();});
  document.getElementById('lfb-filter-toggle').addEventListener('click',function(){var panel=document.getElementById('lfb-advanced-filters'),open=panel.classList.toggle('is-open');this.setAttribute('aria-expanded',open?'true':'false');this.textContent=open?'ซ่อนตัวกรอง':'ตัวกรอง';});
}

function hybridInit(){
  var root=document.getElementById('lfb-root');if(!root)return;
  if(root.getAttribute('data-followup-hybrid')==='1'){renderAll();syncFollowups();return;}
  if(typeof legacyInit==='function')legacyInit();
  var overlay=document.getElementById('lfb-editor-overlay');if(overlay&&overlay.parentNode)overlay.parentNode.removeChild(overlay);
  hybridHtml(overlay);root.setAttribute('data-followup-hybrid','1');
  defaultListView();
  bindHybrid(root);renderAll();syncFollowups();
  if(window.rbApplyHeavyRefreshPermissions)window.rbApplyHeavyRefreshPermissions();
}
window._lfbInit=hybridInit;
window._lfbRender=renderAll;
window._lfbEditorActivate=function(){if(typeof legacyActivate==='function')legacyActivate();defaultListView();hybridInit();return true;};
window._lfbFollowupTest={isMarked:isMarked,needsSystemFollowup:needsSystemFollowup,rowMeta:rowMeta,stageCounts:stageCounts,filteredRows:filteredRows,automaticNextDate:automaticNextDate,followupTiming:followupTiming,formatDateValue:formatDateValue};
window._lfbOpenFollowup=openFollowupModal;
window._lfbCloseFollowup=closeFollowupModal;
document.addEventListener('click',function(event){
  var button=event.target.closest&&event.target.closest('.gsnav-btn');
  if(!button||button.textContent.indexOf('List Facebook')===-1||button.textContent.indexOf('Pages')!==-1)return;
  setTimeout(function(){defaultListView();hybridInit();},0);
},true);
window.addEventListener('storage',function(event){if(event.key===FOLLOW_LOCAL_KEY){followups=readLocal();renderAll();}});
})();
