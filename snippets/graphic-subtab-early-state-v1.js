(function(){
'use strict';
document.addEventListener('click',function(event){
  var button=event.target&&event.target.closest?event.target.closest('.gsnav-btn'):null;
  if(!button)return;
  var team=document.getElementById('tab-team');
  var buttons=team&&Array.prototype.slice.call(team.querySelectorAll('.gsnav-btn'))||[];
  var panels=team&&Array.prototype.slice.call(team.querySelectorAll('.gsp[data-sub]'))||[];
  var index=buttons.indexOf(button);
  var selected=index>=0&&panels[index]&&panels[index].getAttribute('data-sub');
  if(selected){
    try{localStorage.setItem('rb_graphic_sub_v1',selected);}catch(error){}
  }
  if((button.textContent||'').indexOf('ค่าคอมมิชชั่น')<0)return;
  var panel=team&&team.querySelector('[data-sub="commission"]');
  if(team&&panel){
    buttons.forEach(function(item){item.classList.remove('gsnav-active');});
    team.querySelectorAll('.gsp').forEach(function(item){item.classList.remove('gsp-active');});
    button.classList.add('gsnav-active');
    panel.classList.add('gsp-active');
  }
  var tries=0;
  (function ensureCommission(){
    if(typeof window._rbCommissionMount==='function'){
      window._rbCommissionMount();
      return;
    }
    if(++tries<300)setTimeout(ensureCommission,100);
  })();
});
})();
