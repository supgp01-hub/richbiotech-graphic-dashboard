(function(){
'use strict';
var original=window.initLinksPanel;
if(typeof original!=='function')return;

function linksPanel(){return document.querySelector('#tab-team [data-sub="links"]')}
function linksActive(){var team=document.getElementById('tab-team'),panel=linksPanel();return !document.hidden&&!!team&&team.classList.contains('active')&&!!panel&&panel.classList.contains('gsp-active')}
function placeholder(panel,text){panel.innerHTML='<div class="gsp-empty" style="padding:38px 20px">'+text+'</div>'}

window.initLinksPanel=function(container){
  container.setAttribute('data-links-deferred','1');
  placeholder(container,'🔗 รวมลิงก์<br><br><span style="font-size:12px;font-weight:400">ระบบจะโหลดข้อมูลเมื่อเปิดหน้านี้</span>');
};

function openLinks(){
  var panel=linksPanel();if(!panel||panel.getAttribute('data-links-deferred')!=='1')return;
  panel.removeAttribute('data-links-deferred');placeholder(panel,'กำลังโหลดข้อมูลรวมลิงก์...');
  setTimeout(function(){
    if(!linksActive()){panel.setAttribute('data-links-deferred','1');placeholder(panel,'🔗 รวมลิงก์<br><br><span style="font-size:12px;font-weight:400">ระบบจะโหลดข้อมูลเมื่อเปิดหน้านี้</span>');return}
    original(panel);
    if(window.ctCloudInit)window.ctCloudInit();
    if(localStorage.getItem('rb_ct_sync_pending_v1')&&window.ctSyncNow)window.ctSyncNow();
  },80);
}

document.addEventListener('click',function(event){
  var sub=event.target.closest('.gsnav-btn');
  if(sub){if(sub.textContent.indexOf('รวมลิงก์')>=0)setTimeout(openLinks,0);else if(window.ctCloudPause)window.ctCloudPause()}
  if(event.target.closest('#sidebar button,#rb-bottom-nav button'))setTimeout(function(){if(!linksActive()&&window.ctCloudPause)window.ctCloudPause()},0);
});
})();
