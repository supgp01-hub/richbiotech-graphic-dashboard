(function(w,d){
'use strict';
var mq=w.matchMedia('(max-width:900px)'),scheduled=false;
var moved=new Map(),menuDialog=null,lastFocus=null,navigation=0;
var destinations=[['overview','หน้าหลัก','⌂'],['order','สั่งงาน','▤'],['links','รวมลิงก์ Content','↗'],['schedule','วันหยุดทีม','▦'],['team','ทีมงาน','♧'],['commission','ค่าคอมมิชชั่น','฿'],['audit','ยอดหักออดิต','▧'],['fblist','Facebook Pages','f'],['listfb','List Facebook','▣'],['idcard','บัตรประชาชน','▥'],['brands','สินค้า / แบรนด์','◇'],['channels','Social Media','◎'],['planner','แพลนงาน','▦'],['profile','โปรไฟล์','○'],['settings','ตั้งค่า','⚙']];
var subKeys=['team','order','links','commission','audit','fblist','listfb','idcard'];
function allowed(key){var u=w._rbUser;if(!u||!u.uid)return false;if(u.role==='ads')return key==='schedule'||key==='profile';return !['planner','settings'].includes(key)||u.role==='sup';}
function source(key){if(subKeys.includes(key))return d.querySelectorAll('.graphic-subnav .gsnav-btn')[subKeys.indexOf(key)];return Array.from(d.querySelectorAll('#sidebar button')).find(function(b){return (b.getAttribute('onclick')||'').includes("'"+key+"'");});}
function go(key){
 if(!allowed(key))return;var ticket=++navigation;closeMenu(false);
 if(key==='profile'){if(w._rbTogUC)w._rbTogUC();return;}
 if(key==='settings'){if(w._rbShowSP)w._rbShowSP('user');return;}
 if(subKeys.includes(key)||key==='planner'){
  var team=Array.from(d.querySelectorAll('#sidebar button')).find(function(b){return (b.getAttribute('onclick')||'').includes("'team'");});
  if(team)team.click();
  // Graphic mounts lazily on the first visit. Do not lose an early shortcut tap.
  (function openSub(attempt){if(ticket!==navigation||!allowed(key))return;var button=source(key==='planner'?'order':key);if(!button){if(attempt<60)w.setTimeout(function(){openSub(attempt+1);},50);return;}button.click();if(key==='planner'&&w.rbOrderPlanner)w.rbOrderPlanner.open();schedule();})(0);
 }else{var target=source(key);if(target)target.click();}
 schedule();w.scrollTo({top:0,behavior:'auto'});
}
function closeMenu(restore){if(menuDialog&&menuDialog.open)menuDialog.close();if(restore&&lastFocus&&lastFocus.isConnected)lastFocus.focus();}
function openMenu(){
 if(!w._rbUser||!w._rbUser.uid)return;
 if(!menuDialog){menuDialog=d.createElement('dialog');menuDialog.id='rb-mobile-menu';menuDialog.setAttribute('aria-labelledby','rb-mobile-menu-title');menuDialog.innerHTML='<div class="rb-mobile-menu-head"><h2 id="rb-mobile-menu-title">เมนูทั้งหมด</h2><button type="button" aria-label="ปิดเมนู">×</button></div><div class="rb-mobile-menu-grid"></div>';menuDialog.querySelector('button').onclick=function(){closeMenu(true);};menuDialog.addEventListener('cancel',function(){if(lastFocus)lastFocus.focus();});d.body.appendChild(menuDialog);}
 lastFocus=d.activeElement;var grid=menuDialog.querySelector('.rb-mobile-menu-grid');grid.replaceChildren();
 destinations.filter(function(item){return allowed(item[0]);}).forEach(function(item){var b=d.createElement('button');b.type='button';b.dataset.mobileDestination=item[0];var mark=d.createElement('span');mark.className='rb-mobile-nav-symbol';mark.setAttribute('aria-hidden','true');mark.textContent=item[2];b.append(mark,d.createTextNode(item[1]));b.onclick=function(){go(item[0]);};grid.appendChild(b);});
 if(!menuDialog.open)menuDialog.showModal();
}

function navIcon(key){var paths={overview:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',order:'<rect x="5" y="4" width="14" height="17" rx="3"/><rect x="9" y="2" width="6" height="4" rx="1.5"/><path d="m9 13 2 2 4-4"/>',links:'<rect x="6" y="3" width="15" height="15" rx="3"/><path d="M3 7v12a2 2 0 0 0 2 2h12M7 15l4-4 3 3 3-4 3 5"/><circle cx="11" cy="7" r="1"/>',schedule:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-13 4h1m6 0h1m-8 3h1"/>',menu:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>'};return '<svg viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+paths[key]+'</svg>';}
function shell(){
 var nav=d.getElementById('rb-mobile-app-nav');
 if(!nav){nav=d.createElement('nav');nav.id='rb-mobile-app-nav';nav.setAttribute('aria-label','เมนูหลักมือถือ');[['overview','หน้าหลัก','⌂'],['order','งาน','▤'],['links','คอนเทนต์','↗'],['schedule','วันหยุด','▦'],['menu','เมนู','▦']].forEach(function(item){var b=d.createElement('button');b.type='button';b.dataset.mobileNav=item[0];b.innerHTML='<span class="rb-mobile-nav-symbol" aria-hidden="true">'+navIcon(item[0])+'</span><span>'+item[1]+'</span>';b.onclick=function(){item[0]==='menu'?openMenu():go(item[0]);};nav.appendChild(b);});d.body.appendChild(nav);d.documentElement.classList.add('rb-mobile-ui-ready');}
 var active=d.querySelector('.tab-panel.active'),key=active?active.id.replace('tab-',''):'';
 if(key==='team'){var sub=d.querySelector('.gsp-active');key=sub?sub.getAttribute('data-sub'):key;}
 nav.querySelectorAll('button').forEach(function(b){b.hidden=b.dataset.mobileNav!=='menu'&&!allowed(b.dataset.mobileNav);var selected=b.dataset.mobileNav===key||(b.dataset.mobileNav==='menu'&&!['overview','order','links','schedule'].includes(key));if(selected)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
 nav.hidden=!w._rbUser||!w._rbUser.uid;
 // Move the existing controls, preserving handlers and their authorization checks.
 var add=d.getElementById('ord-add-btn'),stats=d.getElementById('ord-stats');
 if(add&&stats&&allowed('order')){
  var toolbar=d.getElementById('rb-mobile-order-actions');
  if(!toolbar){toolbar=d.createElement('div');toolbar.id='rb-mobile-order-actions';stats.before(toolbar);}
  [add,d.getElementById('ord-planner-btn'),d.getElementById('rb-personal-add')].filter(Boolean).forEach(function(button){if(button.parentElement!==toolbar){var anchor=d.createComment('mobile-action-home');button.before(anchor);moved.set(button,anchor);toolbar.appendChild(button);}});
 }
 moved.forEach(function(anchor,button){if(!button.isConnected){if(anchor.isConnected)anchor.remove();moved.delete(button);}});
 var type=d.getElementById('ord-type-filter');
 if(type){var bar=type.parentElement;bar.classList.add('rb-mobile-order-filters');
  var search=d.getElementById('ord-search'),searchBox=Array.from(bar.children).find(function(el){return el===search||el.contains(search);});if(searchBox)searchBox.classList.add('rb-mobile-search-box');
  var toggle=bar.querySelector('.rb-mobile-filter-toggle');if(!toggle){toggle=d.createElement('button');toggle.type='button';toggle.className='rb-mobile-filter-toggle';toggle.textContent='ตัวกรอง';toggle.setAttribute('aria-expanded','false');toggle.onclick=function(){var open=bar.classList.toggle('rb-mobile-filters-open');toggle.setAttribute('aria-expanded',String(open));};bar.appendChild(toggle);}
  Array.from(bar.children).forEach(function(el){if(el!==searchBox&&el!==toggle)el.classList.add('rb-mobile-filter-option');});
 }
}
function restoreActions(){moved.forEach(function(anchor,button){if(anchor.isConnected){anchor.replaceWith(button);}});moved.clear();var toolbar=d.getElementById('rb-mobile-order-actions');if(toolbar)toolbar.remove();closeMenu(false);}
// Keep the original controls and handlers: only annotate the existing table DOM.
function tables(){
 d.querySelectorAll('main table:not(.ord-table):not(.rb-fbp-table)').forEach(function(table){
  var head=table.tHead;if(!head||!head.rows.length)return;
  var labels=Array.from(head.rows[head.rows.length-1].cells).map(function(c){return c.textContent.trim();});
  table.classList.add('rb-mobile-table');table.parentElement.classList.add('rb-mobile-table-wrap');
  Array.from(table.tBodies).forEach(function(body){Array.from(body.rows).forEach(function(row){
   var col=0;Array.from(row.cells).forEach(function(cell){
    if(cell.colSpan>1){cell.classList.add('rb-mobile-wide');col+=cell.colSpan;return;}
    cell.setAttribute('data-mobile-label',labels[col++]||'');
   });
  });});
 });
 var cal=d.querySelector('#tab-schedule .lv-cal');
 if(cal&&!d.getElementById('rb-mobile-calendar-view')){
  var label=d.createElement('label');label.className='rb-mobile-calendar-switch';label.textContent='มุมมองปฏิทิน';
  var select=d.createElement('select');select.id='rb-mobile-calendar-view';select.setAttribute('aria-label','มุมมองปฏิทิน');
  [['month','รายเดือน'],['list','รายการรายวัน']].forEach(function(pair){var o=d.createElement('option');o.value=pair[0];o.textContent=pair[1];select.appendChild(o);});
  select.addEventListener('change',function(){cal.classList.toggle('rb-mobile-agenda',select.value==='list');});label.appendChild(select);cal.before(label);
 }
}
function schedule(){if(scheduled||!mq.matches)return;scheduled=true;w.requestAnimationFrame(function(){scheduled=false;if(!mq.matches)return;tables();shell();});}
function viewport(){if(!mq.matches){d.documentElement.classList.remove('rb-mobile-keyboard');return;}var vv=w.visualViewport,h=vv?vv.height:w.innerHeight;
 d.documentElement.style.setProperty('--rb-mobile-height',Math.round(h)+'px');
 var edit=d.activeElement&&d.activeElement.matches('input,textarea,[contenteditable="true"]');
 d.documentElement.classList.toggle('rb-mobile-keyboard',!!(edit&&vv&&vv.scale===1&&h<w.innerHeight*.78));
}
function boot(){new MutationObserver(schedule).observe(d.body,{childList:true,subtree:true});schedule();viewport();}
mq.addEventListener('change',function(){if(!mq.matches)restoreActions();schedule();viewport();});w.addEventListener('resize',viewport);
// Authentication and navigation can change classes without replacing a panel.
w.addEventListener('rb:auth-ready',schedule);w.addEventListener('rb:auth-cleared',function(){closeMenu(false);restoreActions();schedule();});
d.addEventListener('click',function(e){if(e.target.closest('#sidebar,#rb-bottom-nav,.gsnav-btn'))schedule();});
if(w.visualViewport)w.visualViewport.addEventListener('resize',viewport);
d.addEventListener('focusin',viewport);d.addEventListener('focusout',function(){setTimeout(viewport,0);});
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot);else boot();
})(window,document);
