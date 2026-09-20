(function(w,d){
'use strict';
var last=0,wasHidden=d.hidden;
function attempt(fn){try{Promise.resolve(fn()).catch(function(){});}catch(e){}}
function resume(event){
 // pagehide stops the stream and releases leadership. A bfcache restore may
 // emit pageshow without visibilitychange, so explicitly restart that lifecycle.
 if(!event.persisted||d.hidden||navigator.onLine===false||!w._rbUser||!w._rbUser.uid||Date.now()-last<1500)return;
 last=Date.now();
 attempt(function(){if(w.rbMultiTab)return w.rbMultiTab.claim();});
 attempt(function(){if(w.rbOrderSync)return w.rbOrderSync.flush();});
 attempt(function(){if(w.rbPersistence)return w.rbPersistence.flush();});
 attempt(function(){if(w.rbSharedBusinessSync)return w.rbSharedBusinessSync.pull(false);});
 attempt(function(){if(w.rbLeavePersistence)return w.rbLeavePersistence.flush();});
 attempt(function(){if(w.fbRefreshOrders)return w.fbRefreshOrders();});
 attempt(function(){if(w.fbSyncStart)return w.fbSyncStart();});
 attempt(function(){if(w.rbSyncWatchdog)return w.rbSyncWatchdog.retry();});
 attempt(function(){if(w.rbFacebookPageNotifications)return w.rbFacebookPageNotifications.pull();});
 // Existing panels own merges, pending edits, account isolation and errors.
 // Never reload, clear local storage or manufacture an online acknowledgement.
}
w.addEventListener('pageshow',resume);
// Mobile browsers commonly suspend a background tab without a bfcache restore.
// Resume the same guarded services once on return; each service owns its queue.
d.addEventListener('visibilitychange',function(){
 if(d.hidden){wasHidden=true;return;}
 if(wasHidden){wasHidden=false;resume({persisted:true});}
});
})(window,document);
