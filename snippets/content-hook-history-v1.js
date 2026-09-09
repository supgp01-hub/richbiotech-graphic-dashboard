(function(w){
'use strict';
function allowed(){var u=w._rbUser||{};return u.role==='sup'&&['VIEW','วิว'].includes(String(u.name||'').normalize('NFKC').trim().toUpperCase());}
function norm(v){return String(v||'').normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function timestamp(v){var n=typeof v==='number'?v:Date.parse(v);return Number.isFinite(n)&&n>0?n:0;}
function matches(row,orders,rows){
 var brand=norm(row.brand),hook=norm(row.ready||row.hook),name=norm(row.episode||row.name);if(!brand||!hook)return [];
 var peers=(rows||[]).filter(function(r){return norm(r.brand)===brand&&norm(r.ready||r.hook)===hook;});
 var seen={};return (orders||[]).filter(function(o){
  if(!o||o._deleted||o.deleted||o.deletedAt)return false;
  var id=o._fbKey||o.id;if(!id||seen[id])return false;
  if(norm(o.product)!==brand||![norm(o.hook),norm(o.hook2)].includes(hook))return false;
  var exact=norm(o.name||o.title)===name;
  if(exact&&peers.filter(function(r){return norm(r.episode||r.name)===name;}).length>1)return false;
  if(!exact&&peers.length!==1)return false;
  seen[id]=true;return true;
 }).sort(function(a,b){return timestamp(b.createdAt)-timestamp(a.createdAt)||String(a._fbKey||a.id).localeCompare(String(b._fbKey||b.id));});
}
function orders(){return typeof w.lpORD==='function'?w.lpORD():[];}
function rows(){return w.ctContentRows?w.ctContentRows():[];}
function groups(list){var out={};list.forEach(function(r){var k=norm(r.brand)+'\u0000'+norm(r.ready||r.hook);(out[k]||(out[k]=[])).push(r);});return out;}
function date(v,time){if(!v)return 'ไม่พบวันที่';var d=new Date(v);return isNaN(d.getTime())?'ไม่พบวันที่':d.toLocaleString('th-TH',{timeZone:'Asia/Bangkok',day:'2-digit',month:'2-digit',year:'numeric',...(time?{hour:'2-digit',minute:'2-digit'}:{})});}
function list(row){return matches(row,orders(),rows());}
function cell(row){if(!allowed())return '';var found=list(row),unknown=found.some(function(o){return !timestamp(o.createdAt);});return '<td class="cth-deadline">'+(unknown?'รอตรวจสอบวันที่สั่ง':found.length?esc(found[0].deadline?date(found[0].deadline):'ยังไม่กำหนด'):'—')+'</td>';}
function close(){var p=document.getElementById('cth-drawer');if(p)p.remove();}
function open(query){if(!allowed())return;close();var p=document.createElement('aside');p.id='cth-drawer';p.setAttribute('role','dialog');p.setAttribute('aria-label','ประวัติการสั่ง HOOK');p.innerHTML='<header><div><b>ประวัติการสั่ง HOOK</b><small>เฉพาะ VIEW · เรียงตามวันที่สั่งล่าสุด</small></div><button aria-label="ปิดประวัติ">×</button></header><input type="search" placeholder="ค้นหาสินค้า / HOOK / ชื่องาน"><div class="cth-results"></div>';document.body.appendChild(p);p.querySelector('button').onclick=close;var input=p.querySelector('input');input.value=query||'';input.oninput=function(){draw(p,input.value);};draw(p,input.value);}
function draw(p,q){if(!allowed()){close();return;}q=norm(q);var allRows=rows(),allOrders=orders(),byHook=groups(allRows),html='',count=0;allRows.forEach(function(r){if(q&&!norm([r.brand,r.ready,r.episode].join(' ')).includes(q))return;var found=matches(r,allOrders,byHook[norm(r.brand)+'\u0000'+norm(r.ready||r.hook)]||[]);if(!found.length)return;count++;html+='<details><summary><b>'+esc(r.brand)+' · '+esc(r.ready||r.hook)+'</b><span>สั่ง '+found.length+' ครั้ง</span><small>'+esc(r.episode||r.name)+'</small></summary>'+found.map(function(o){return '<article><b>'+esc(o.id)+' · '+esc(o.assignee||'ไม่ระบุผู้รับผิดชอบ')+'</b><div>วันที่สั่ง: '+esc(date(o.createdAt,true))+'</div><div>Deadline: '+esc(date(o.deadline))+'</div></article>';}).join('')+'</details>';});p.querySelector('.cth-results').innerHTML='<p class="cth-note">นับแต่ละงานครั้งเดียว การแก้ Deadline ไม่เพิ่มจำนวนครั้ง ข้อมูลย้อนหลังอิงงานต้นทางที่ยังอยู่ในระบบ</p>'+(count?html:'<p>ไม่พบประวัติที่เชื่อมโยงได้</p>');}
function mount(){var actions=document.querySelector('.ct-actions'),head=document.querySelector('.ct-table thead tr');if(!actions||!head)return;var th=head.querySelector('.cth-heading');if(allowed()&&!th){th=document.createElement('th');th.className='cth-heading';th.textContent='วันที่ส่ง';var hook=Array.from(head.children).find(function(n){return n.textContent.trim().toLowerCase()==='hook';});if(hook)hook.insertAdjacentElement('afterend',th);}if(!allowed()&&th)th.remove();var b=document.getElementById('cth-open');if(!b){b=document.createElement('button');b.id='cth-open';b.className='ct-btn ct-btn-secondary';b.textContent='◷ ประวัติการสั่ง HOOK';b.onclick=function(){open();};actions.appendChild(b);}b.hidden=!allowed();if(!allowed()){close();document.querySelectorAll('.cth-warning').forEach(function(n){n.remove();});}}
function warning(e){if(!allowed())return;var target=e.target;if(!target.matches('#om-hook,#om-hook2,#om-name,#om-prod,.rbp-detail-editor [data-field]'))return;var planner=target.closest('.rbp-detail-editor'),host=planner||target.closest('#rb-order-modal')||target.parentElement;
 function value(field,id){var el=planner?planner.querySelector('[data-field="'+field+'"]'):document.getElementById(id);return el?el.value:'';}
 var product=value('product','om-prod'),name=value('name','om-name'),hooks=[value('hook','om-hook'),value('hook2','om-hook2')],found=[],seen={};hooks.filter(Boolean).forEach(function(h){var r={brand:product,episode:name,ready:h};matches(r,orders(),rows()).forEach(function(o){var id=o._fbKey||o.id;if(!seen[id]){seen[id]=true;found.push(o);}});});var box=host.querySelector('.cth-warning');if(!box){box=document.createElement('div');box.className='cth-warning';host.appendChild(box);}box.hidden=!found.length;box.textContent=found.length?'HOOK ที่เลือกเคยสั่งแล้ว '+found.length+' งาน · ยังสั่งซ้ำได้ตามต้องการ ':'';if(found.length){var b=document.createElement('button');b.textContent='ดูประวัติ';b.onclick=function(){open(product);};box.appendChild(b);}}
document.addEventListener('change',warning);w.addEventListener('rb:auth-ready',function(){mount();if(w.ctRender)w.ctRender();});w.addEventListener('rb:auth-cleared',function(){close();mount();});
w.ctHookHistory={allowed:allowed,matches:matches,cell:cell,mount:mount,signature:function(){return allowed()?JSON.stringify(orders().map(function(o){return [o._fbKey,o.id,o.product,o.name,o.title,o.hook,o.hook2,o.createdAt,o.deadline,o._deleted,o.deletedAt];})):'hidden';}};
})(window);
