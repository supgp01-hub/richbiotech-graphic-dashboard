(function(){
'use strict';
var KEY='rb_active_sync_tab_v1';
var TAB='tab_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);
var TTL=12000,BEAT=4000,timer=null,leader=false;
function read(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){return null}}
function write(){try{localStorage.setItem(KEY,JSON.stringify({id:TAB,ts:Date.now()}));return true}catch(e){return false}}
function stale(v){return !v||!v.id||Date.now()-(Number(v.ts)||0)>TTL}
function emit(next){if(leader===next)return;leader=next;try{window.dispatchEvent(new CustomEvent('rb:leader-change',{detail:{leader:leader,tabId:TAB}}))}catch(e){}}
function beat(){var v=read();if(leader){if(v&&v.id!==TAB&&!stale(v)){emit(false);return}write();}else if(!document.hidden&&stale(v)){claim();}}
function start(){clearInterval(timer);timer=setInterval(beat,BEAT)}
function claim(){if(document.hidden){emit(false);return false}var v=read();if(stale(v)||v.id===TAB){write();var won=(read()||{}).id===TAB;emit(won);if(won)start();return won}emit(false);start();return false}
function release(){var v=read();if(v&&v.id===TAB){try{localStorage.removeItem(KEY)}catch(e){}}emit(false)}
window.rbMultiTab={id:TAB,isLeader:function(){return leader},claim:claim,release:release};
window.addEventListener('storage',function(e){if(e.key===KEY){var v=read();if(v&&v.id!==TAB&&!stale(v))emit(false);else if(!document.hidden)claim();}});
document.addEventListener('visibilitychange',function(){if(document.hidden)release();else claim();});
window.addEventListener('pagehide',release);
claim();start();
})();
