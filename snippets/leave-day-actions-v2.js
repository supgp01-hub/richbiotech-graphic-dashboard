(function(root){
'use strict';
if(root._rbLeaveDayActionsV2Loaded)return;
root._rbLeaveDayActionsV2Loaded=true;

var VERSION='2.0.0';
var observer=null;

function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(ch){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});}
function manager(){var role=root._rbUser&&root._rbUser.role;return role==='sup'||role==='spec';}
function actor(){return root._rbUser&&root._rbUser.name||'พนักงาน';}
function dateKey(date){return date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate();}

function feedbackHost(){
  var modal=document.getElementById('lv-modal'),box=modal&&modal.querySelector('.lvw-combined-box'),mode=box&&box.getAttribute('data-lvw-mode')||'leave';
  var pane=box&&box.querySelector(mode==='special'?'#lvw-combined-special':'#lvw-combined-leave');
  if(!pane&&box)pane=box.querySelector('.lvw-combined-pane');
  if(!pane)return null;
  var host=modal.querySelector('.lvw-persist-feedback');
  if(!host){host=document.createElement('div');host.className='lvw-persist-feedback';host.setAttribute('role','status');host.setAttribute('aria-live','polite');pane.insertBefore(host,pane.firstChild);}
  return host;
}
function showFeedback(state,title,detail){
  var host=feedbackHost();if(!host)return;
  host.className='lvw-persist-feedback '+state;
  host.innerHTML='<b>'+esc(title)+'</b><small>'+esc(detail||'')+'</small>';
}
function syncPromise(){
  if(root.rbLeavePersistence&&typeof root.rbLeavePersistence.waitForSync==='function')return root.rbLeavePersistence.waitForSync(4500);
  return Promise.resolve(true);
}
function finishSave(options){
  options=options||{};
  var button=options.button||document.getElementById('lv-f-save');
  if(button){button.disabled=true;button.setAttribute('data-old-text',button.textContent||'บันทึก');button.textContent='กำลังบันทึกออนไลน์…';}
  showFeedback('is-saving','กำลังบันทึก…','ระบบกำลังยืนยันข้อมูลกับฐานข้อมูลออนไลน์');
  return Promise.resolve(options.promise||syncPromise()).then(function(ok){
    if(ok!==false){
      showFeedback('is-saved','บันทึกออนไลน์แล้ว','ข้อมูลของ '+actor()+' ถูกบันทึกเรียบร้อยและจะไม่ทับรายการของคนอื่น');
      if(button){button.textContent='✓ บันทึกออนไลน์แล้ว';button.disabled=true;}
      setTimeout(function(){if(typeof options.close==='function')options.close();},550);
      return true;
    }
    showFeedback('is-pending','เก็บข้อมูลไว้แล้ว · รอซิงก์','ข้อมูลไม่หายและระบบจะลองบันทึกใหม่อัตโนมัติเมื่อเชื่อมต่อได้');
    if(button){button.disabled=false;button.textContent='ลองบันทึกออนไลน์อีกครั้ง';}
    return false;
  },function(){
    showFeedback('is-pending','เก็บข้อมูลไว้แล้ว · รอซิงก์','ข้อมูลไม่หายและระบบจะลองบันทึกใหม่อัตโนมัติ');
    if(button){button.disabled=false;button.textContent='ลองบันทึกออนไลน์อีกครั้ง';}
    return false;
  });
}

function openToday(){
  var now=new Date(),key=dateKey(now);
  if(root.LV_CUR&&(root.LV_CUR.y!==now.getFullYear()||root.LV_CUR.m!==now.getMonth()+1)){
    root.LV_CUR.y=now.getFullYear();root.LV_CUR.m=now.getMonth()+1;
    if(typeof root.lvRender==='function')root.lvRender();
  }
  setTimeout(function(){
    var cell=document.querySelector('.lv-day[data-lvw-date="'+key+'"],.lv-day-today');
    if(cell){cell.click();return;}
    if(typeof root.lvOpenDay==='function')root.lvOpenDay(now.getFullYear(),now.getMonth()+1,now.getDate());
  },80);
}
function ensureTodayAction(){
  var summary=document.getElementById('lvw-today-summary');
  if(summary&&!summary.querySelector('.lvw-open-today')){
    var button=document.createElement('button');button.type='button';button.className='lvw-open-today';button.innerHTML='<span>＋</span> ลงข้อมูลวันนี้';button.onclick=openToday;summary.appendChild(button);
  }
  var today=document.querySelector('#tab-schedule .lv-day-today');
  if(today&&!today.querySelector('.lvw-today-action')){
    var hint=document.createElement('span');hint.className='lvw-today-action';hint.textContent='วันนี้ · กดเพื่อลงหรือแก้ไข';today.appendChild(hint);
  }
}
function ensureScopeNotice(){
  var modal=document.getElementById('lv-modal');if(!modal||!modal.classList.contains('open'))return;
  var box=modal.querySelector('.lvw-combined-box');if(!box||box.querySelector('.lvw-record-scope'))return;
  var tabs=box.querySelector('.lvw-combined-tabs'),notice=document.createElement('div');
  notice.className='lvw-record-scope';
  notice.innerHTML='<b>'+(manager()?'โหมดผู้ดูแล':'รายการของ '+esc(actor()))+'</b><span>'+(manager()?'เลือกพนักงานแล้วระบบจะบันทึกแยกเป็นรายคน':'คุณแก้ไขหรือลบได้เฉพาะรายการของตัวเอง')+' · ไม่ทับข้อมูลพนักงานคนอื่น</span>';
  if(tabs)tabs.insertAdjacentElement('afterend',notice);else box.insertBefore(notice,box.firstChild);
}
function refresh(){ensureTodayAction();ensureScopeNotice();}
function install(){
  refresh();
  if(!observer&&document.body){observer=new MutationObserver(function(){setTimeout(refresh,0);});observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});}
  document.documentElement.setAttribute('data-leave-day-actions',VERSION);
}

root.rbLeaveFinishSave=finishSave;
root.rbLeaveOpenToday=openToday;
root.rbLeaveDayActions={version:VERSION,refresh:refresh,finishSave:finishSave};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})(window);
