(function(root){
'use strict';
if(root._rbWorkflowSyncRetryBridgeV1)return;
root._rbWorkflowSyncRetryBridgeV1=true;

document.addEventListener('click',function(event){
  var button=event.target&&event.target.closest?event.target.closest('#rb-ops-retry'):null;
  if(!button)return;
  if(root.rbPersistence&&typeof root.rbPersistence.flush==='function')root.rbPersistence.flush();
  if(typeof root.fbFlushOrderQueue==='function')root.fbFlushOrderQueue();
},true);
})(window);
