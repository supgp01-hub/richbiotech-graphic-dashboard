(function(w){
'use strict';
var PATH='/workflow_snapshots/fbpage_notifications_v1',values={},drafts={},pending={},revision=0,readSequence=0,session='',timer=null;
function actor(){return w._rbUser&&[w.rbFirebaseAuth&&w.rbFirebaseAuth.user&&w.rbFirebaseAuth.user.uid||w._rbUser.uid||'',w._rbUser.name||'',w._rbUser.role||''].join('|')||'';}
function reset(){var next=actor();if(next!==session){session=next;values={};drafts={};pending={};revision++;}return next;}
function allowed(){return ['sup','spec','audit','graphic','ads'].indexOf(w._rbUser&&w._rbUser.role)>=0;}
function changed(){w.dispatchEvent(new CustomEvent('rb:fbpage-notifications'));}
function legacy(record){try{var data=JSON.parse(localStorage.getItem('rb_fb_notif')||'{}');return data[record._fbpSourceName||record.name]||'';}catch(e){return '';}}
function value(record){reset();var entry=values[record._fbpKey];return entry&&['','1','2'].indexOf(entry.value)>=0?entry.value:legacy(record);}
function state(record){reset();var key=record._fbpKey;return {value:pending[key]?pending[key].value:drafts[key]!==undefined?drafts[key]:value(record),pending:!!pending[key],error:drafts[key]!==undefined&&!pending[key]};}
async function request(path,options){
  if(!w.rbFirebaseAuth||!w.rbFirebaseAuth.fetch)throw Error('online authentication unavailable');
  var control=new AbortController(),timeout=setTimeout(function(){control.abort();},20000);
  try{var response=await w.rbFirebaseAuth.fetch((typeof FB_DB!=='undefined'?FB_DB:'https://richbiotech-c4e41-default-rtdb.firebaseio.com')+path+'.json',Object.assign({cache:'no-store',signal:control.signal},options||{}));if(!response.ok)throw Error('online request failed');return await response.json();}finally{clearTimeout(timeout);}
}
function pull(){
  reset();if(!session||document.hidden||navigator.onLine===false)return Promise.resolve(false);
  var started=revision,who=session,sequence=++readSequence;
  return request(PATH).then(function(data){if(who!==actor()||started!==revision||sequence!==readSequence||Object.keys(pending).length)return false;values=data&&typeof data==='object'?data:{};changed();return true;}).catch(function(){return false;});
}
function save(record,next){
  reset();var key=record._fbpKey,who=session;
  if(!allowed()||!key||!/^[A-Za-z0-9_-]+$/.test(key)||['','1','2'].indexOf(next)<0)return Promise.resolve(false);
  if(pending[key])return pending[key].promise;
  drafts[key]=next;revision++;
  if(navigator.onLine===false||!w.rbFirebaseAuth){changed();return Promise.resolve(false);}
  var entry={value:next,sourceName:record._fbpSourceName||record.name,updatedAt:Date.now(),updatedBy:w._rbUser.name||''};
  var operation={value:next};pending[key]=operation;changed();
  operation.promise=request(PATH+'/'+key,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(entry)}).then(function(confirmed){
    if(!confirmed||confirmed.value!==next||confirmed.updatedAt!==entry.updatedAt)throw new Error('online acknowledgement required');
    if(who!==actor())return false;
    values[key]=entry;delete drafts[key];return true;
  }).catch(function(){return false;}).finally(function(){if(who===actor()){delete pending[key];revision++;changed();}});
  return operation.promise;
}
function schedule(){clearTimeout(timer);timer=setTimeout(function(){if(document.querySelector('[data-sub="fblist"].gsp-active'))pull();schedule();},30000);}
w.rbFacebookPageNotifications={value:value,state:state,save:save,pull:pull,pendingCount:function(){reset();return Object.keys(drafts).length;}};
w.addEventListener('beforeunload',function(e){if(Object.keys(drafts).length||Object.keys(pending).length){e.preventDefault();e.returnValue='';}});
w.addEventListener('focus',pull);w.addEventListener('online',pull);document.addEventListener('visibilitychange',function(){if(!document.hidden)pull();});
w.addEventListener('rb:auth-ready',function(){reset();changed();pull();});
schedule();
})(window);
