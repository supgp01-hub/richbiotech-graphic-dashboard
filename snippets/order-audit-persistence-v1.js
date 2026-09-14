(function(window){
  'use strict';
  var fields={fbName:'om-fbname',pageName:'om-pagename',fbUpList:'om-fbuplist',contentUpList:'om-contentuplist',camp1:'om-camp1',camp2:'om-camp2',upLink:'om-uplink',adLink:'om-ad',auditNote:'om-audit-note',auditError:'om-audit-error',auditFixed:'om-audit-fixed',imgsNote:'om-imgs-note'};
  var baseline=null,pending=null;
  function clone(value){return value==null?null:JSON.parse(JSON.stringify(value));}
  function equal(a,b){return window.rbSafeOrderWrite?window.rbSafeOrderWrite.equal(a,b):JSON.stringify(a==null?null:a)===JSON.stringify(b==null?null:b);}
  function key(order){return String(order&& (order._fbKey||order.id)||'');}
  function canAudit(){var role=window._rbUser&&window._rbUser.role;return role==='sup'||role==='audit';}
  function campaigns(root,getElement){return Array.prototype.slice.call(root.querySelectorAll('#om-camp-extra .om-camp-row')).map(function(row,index){var number=index+3,name=getElement('om-camp'+number),link=getElement('om-link'+number);return{name:name?name.value||'':'',link:link?link.value||'':''};});}
  // Capture once after hydration, not after a realtime update. Unchanged inputs
  // are not edits. Keep the original values for conditional conflict checking.
  window.rbCaptureAuditBaseline=function(order){
    var get=function(id){return document.getElementById(id);};
    baseline={key:key(order),raw:clone(order||{}),form:{}};pending=null;
    Object.keys(fields).forEach(function(k){var el=get(fields[k]);if(el)baseline.form[k]=el.value||'';});
    baseline.form.campExtra=campaigns(document,get);
    ['rb-audit-version-workflow','rb-team-version-workflow'].forEach(function(id){var old=get(id);if(old)old.remove();});
  };
  window.rbCaptureAuditVersionBaseline=function(order,states){if(baseline&&baseline.key===key(order)&&!Object.prototype.hasOwnProperty.call(baseline.form,'auditVersions'))baseline.form.auditVersions=clone(states);};
  window.rbAuditSaveBase=function(order,field,fallback){
    if(!pending||pending.key!==key(order)||!Object.prototype.hasOwnProperty.call(pending.values,field))return fallback;
    var value=pending.values[field];delete pending.values[field];return value;
  };
  window.rbAuditSaveAcknowledged=function(){
    if(baseline&&pending&&baseline.key===pending.key&&pending.rebase){baseline.raw=pending.rebase.raw;baseline.form=pending.rebase.form;}
  };
  window.rbGuardEmployeeOrderAction=function(order,openedStatus){
    return !!order&&order.status===openedStatus;
  };
  window.rbGuardEmployeeAuditEvidence=function(order){return !baseline||baseline.key!==key(order)||equal(baseline.raw.auditVersions,order.auditVersions);};

  window._rbEnableOrderManagerEdit=function(section){if(!section)return;Array.prototype.forEach.call(section.children,function(el){el.style.pointerEvents='auto';el.style.opacity='1';});section.querySelectorAll('input,select,textarea,button').forEach(function(el){el.disabled=false;el.style.pointerEvents='auto';el.style.opacity='1';});};

  window.rbPersistAuditFields=function(order,getElement,root){
    if(!order||typeof getElement!=='function')return order;
    root=root||document;
    var active=baseline&&baseline.key===key(order)?baseline:null;
    pending={key:key(order),values:{}};
    var submitted=active?clone(active.form):{};
    function apply(field,value){
      submitted[field]=clone(value);
      if(active&&equal(value,active.form[field]))return;
      if(active)pending.values[field]=clone(active.raw[field]);
      order[field]=value;
    }
    Object.keys(fields).forEach(function(key){
      var element=getElement(fields[key]);
      if(element&&(canAudit()||['upLink','adLink','imgsNote'].indexOf(key)>=0))apply(key,element.value||'');
    });
    if(canAudit())apply('campExtra',campaigns(root,getElement));
    var workflow=root.querySelector&&root.querySelector('#rb-audit-version-workflow');
    var workflowJob=workflow&&String(workflow.getAttribute('data-job-id')||'').trim();
    var orderJob=String(order.id||'').trim();
    /* A modal can briefly contain the previous job's rendered Audit cards while
       the next job is loading. Never copy that DOM state into another order. */
    if(canAudit()&&workflow&&workflowJob&&orderJob&&workflowJob===orderJob&&typeof window.rbCollectAuditVersionWorkflow==='function'){
      apply('auditVersions',window.rbCollectAuditVersionWorkflow(workflow));
    }
    pending.rebase={raw:clone(order),form:submitted};
    return order;
  };

  window.rbSyncOrderDeliveryLinks=function(){
    /* Keep one presentation on the send-image tab, sourced only from the
       dedicated imageSubmitLinks editor.  The ad-link set stays separate. */
    var duplicate=document.getElementById('om-image-submitlink-box');
    if(duplicate)duplicate.remove();
    if(typeof window._refreshImageSubmitLinkDisplay==='function')window._refreshImageSubmitLinkDisplay();
  };

  window.rbCopyOrderDeliveryLink=function(value,button){
    function done(){
      button.classList.add('is-copied');button.setAttribute('aria-label','คัดลอกแล้ว');
      setTimeout(function(){button.classList.remove('is-copied');button.setAttribute('aria-label','คัดลอกลิงก์');},1200);
    }
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(value).then(done).catch(function(){});return;
    }
    var temp=document.createElement('textarea');temp.value=value;temp.style.position='fixed';temp.style.opacity='0';
    document.body.appendChild(temp);temp.select();
    try{document.execCommand('copy');done();}catch(error){}
    temp.remove();
  };

  if(document.addEventListener){
    document.addEventListener('input',function(event){
      if(event.target&&event.target.closest&&event.target.closest('#om-image-submitlinks-rows'))window.rbSyncOrderDeliveryLinks();
    });
    document.addEventListener('click',function(event){
      if(event.target&&event.target.closest&&event.target.closest('#rb-order-modal'))setTimeout(window.rbSyncOrderDeliveryLinks,0);
    },true);
  }
})(window);
