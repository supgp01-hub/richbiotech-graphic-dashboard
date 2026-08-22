(function(){
'use strict';
var KEY='rb_active_sync_tab_v1';
var TAB='tab_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);
var TTL=12000,BEAT=4000,timer=null,claimTimer=null,leader=false;
function read(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){return null}}
function write(nonce){try{localStorage.setItem(KEY,JSON.stringify({id:TAB,ts:Date.now(),nonce:nonce}));return true}catch(e){return false}}
function stale(v){return !v||!v.id||Date.now()-(Number(v.ts)||0)>TTL}
function emit(next){if(leader===next)return;leader=next;try{window.dispatchEvent(new CustomEvent('rb:leader-change',{detail:{leader:leader,tabId:TAB}}))}catch(e){}}
function cancelClaim(){if(claimTimer){clearTimeout(claimTimer);claimTimer=null}}
function start(){clearInterval(timer);timer=setInterval(beat,BEAT)}
function attempt(){
  claimTimer=null;
  if(document.hidden){emit(false);return}
  var current=read();
  if(!stale(current)&&current.id!==TAB){emit(false);start();return}
  var nonce=TAB+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7);
  if(!write(nonce)){emit(false);start();return}
  claimTimer=setTimeout(function(){
    claimTimer=null;
    var confirmed=read();
    emit(!!confirmed&&confirmed.id===TAB&&confirmed.nonce===nonce);
    start();
  },140+Math.floor(Math.random()*80));
}
function claim(){
  if(document.hidden){cancelClaim();emit(false);return false}
  var current=read();
  if(current&&current.id===TAB&&!stale(current)){cancelClaim();emit(true);start();return true}
  if(!stale(current)){cancelClaim();emit(false);start();return false}
  if(!claimTimer)claimTimer=setTimeout(attempt,40+Math.floor(Math.random()*160));
  return leader;
}
function beat(){
  var current=read();
  if(leader){
    if(current&&current.id!==TAB&&!stale(current)){emit(false);return}
    write(current&&current.nonce||TAB);
  }else if(!document.hidden&&stale(current)){claim()}
}
function release(){
  cancelClaim();
  var current=read();
  if(current&&current.id===TAB){try{localStorage.removeItem(KEY)}catch(e){}}
  emit(false);
}
window.rbMultiTab={id:TAB,isLeader:function(){return leader},claim:claim,release:release};
window.addEventListener('storage',function(e){
  if(e.key!==KEY)return;
  var current=read();
  if(current&&current.id!==TAB&&!stale(current)){cancelClaim();emit(false);start();return}
  if(!document.hidden)claim();
});
document.addEventListener('visibilitychange',function(){if(document.hidden)release();else claim()});
window.addEventListener('pagehide',release);
claim();
start();
})();
