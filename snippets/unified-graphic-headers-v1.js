(function(){
'use strict';
var CONFIG={
  order:{title:'ศูนย์สั่งงาน Graphic',subtitle:'สร้าง มอบหมาย และติดตามสถานะงานของทีม',icon:'clipboard',host:function(p){return p.firstElementChild||p;}},
  links:{title:'ศูนย์รวมลิงก์ Content',subtitle:'จัดการสคริปต์ ลิงก์คลิป และข้อมูล Content ในที่เดียว',icon:'link',host:function(p){return p.querySelector('.ct-wrap')||p;}},
  commission:{title:'ค่าคอมมิชชั่น',subtitle:'ตรวจสอบและอัปเดตข้อมูลค่าคอมมิชชั่นของทีม',icon:'coin',host:function(p){return p;}},
  audit:{title:'ยอดหักออดิต',subtitle:'สรุปและตรวจสอบยอดหักออดิตอย่างเป็นระบบ',icon:'audit',host:function(p){return p;}},
  fblist:{title:'ศูนย์จัดการ Facebook Pages',subtitle:'ดูสถานะเพจ อัปเดตข้อมูล และเพิ่มรายการใหม่',icon:'facebook',host:function(p){return p;}},
  idcard:{title:'บัตรประชาชนพนักงาน',subtitle:'จัดเก็บและตรวจสอบข้อมูลบัตรของทีมงาน',icon:'card',host:function(p){return p.querySelector('#ic-root')||p;}}
};
var PATH={clipboard:'<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4.5V3h6v1.5M9 9h6M9 13h6M9 17h4"/>',link:'<path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1"/>',coin:'<circle cx="12" cy="12" r="9"/><path d="M15 8.5c-.7-.7-1.7-1-3-1-1.7 0-3 1-3 2.3 0 3.7 6 1.7 6 5.2 0 1.3-1.3 2.3-3 2.3-1.3 0-2.5-.4-3.3-1.2M12 5v14"/>',audit:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',facebook:'<circle cx="12" cy="12" r="9"/><path d="M14.5 8H13a2 2 0 0 0-2 2v9M8 13h6"/>',card:'<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16c.7-1.5 1.7-2 3-2s2.3.5 3 2M14 10h4M14 14h4"/>',plus:'<path d="M5 12h14M12 5v14"/>',upload:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',refresh:'<path d="M20 7v5h-5M4 17v-5h5"/><path d="M6.1 8A7 7 0 0 1 18.7 7M17.9 16A7 7 0 0 1 5.3 17"/>'};
function svg(name){return '<svg viewBox="0 0 24 24" aria-hidden="true">'+(PATH[name]||PATH.clipboard)+'</svg>';}
function decorate(panel,key){var cfg=CONFIG[key];if(!cfg||key==='listfb'||panel.querySelector('.rb-unified-section-banner'))return;var host=cfg.host(panel);if(!host)return;var banner=document.createElement('section');banner.className='rb-unified-section-banner';banner.setAttribute('aria-label',cfg.title);banner.innerHTML='<span class="rb-unified-section-icon">'+svg(cfg.icon)+'</span><div class="rb-unified-section-copy"><div class="rb-unified-section-title">'+cfg.title+'</div><div class="rb-unified-section-subtitle">'+cfg.subtitle+'</div></div>';host.insertBefore(banner,host.firstChild);panel.classList.add('rb-unified-graphic-section');panel.setAttribute('data-rb-unified-header','1');}
function apply(){var team=document.getElementById('tab-team');if(!team)return;Object.keys(CONFIG).forEach(function(key){var panel=team.querySelector('.gsp[data-sub="'+key+'"]');if(panel)decorate(panel,key);});}
function schedule(){clearTimeout(schedule.t);schedule.t=setTimeout(apply,50);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);else schedule();
document.addEventListener('click',function(e){if(e.target&&e.target.closest&&e.target.closest('.graphic-subnav'))schedule();});
new MutationObserver(function(ms){var relevant='.gsp[data-sub],#ord-add-btn,.ct-wrap,#lfb-upd,#fp-add-btn,#ic-root,.ic-addbtn,.rb-heavy-toolbar';for(var i=0;i<ms.length;i++){for(var j=0;j<ms[i].addedNodes.length;j++){var n=ms[i].addedNodes[j];if(n.nodeType===1&&(n.matches(relevant)||n.querySelector(relevant))){schedule();return;}}}}).observe(document.documentElement,{childList:true,subtree:true});
window.rbApplyUnifiedGraphicHeaders=apply;
})();
