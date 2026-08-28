(function(window){
  'use strict';

  window._rbEnableOrderManagerEdit=function(section){if(!section)return;Array.prototype.forEach.call(section.children,function(el){el.style.pointerEvents='auto';el.style.opacity='1';});section.querySelectorAll('input,select,textarea,button').forEach(function(el){el.disabled=false;el.style.pointerEvents='auto';el.style.opacity='1';});};

  window.rbPersistAuditFields=function(order,getElement,root){
    if(!order||typeof getElement!=='function')return order;
    root=root||document;
    var fields={
      fbName:'om-fbname',pageName:'om-pagename',
      fbUpList:'om-fbuplist',contentUpList:'om-contentuplist',
      camp1:'om-camp1',camp2:'om-camp2',
      upLink:'om-uplink',adLink:'om-ad',auditNote:'om-audit-note',
      auditError:'om-audit-error',auditFixed:'om-audit-fixed',imgsNote:'om-imgs-note'
    };
    Object.keys(fields).forEach(function(key){
      var element=getElement(fields[key]);
      if(element)order[key]=element.value||'';
    });
    var rows=root.querySelectorAll('#om-camp-extra .om-camp-row');
    order.campExtra=Array.prototype.slice.call(rows).map(function(row,index){
      var number=index+3,name=getElement('om-camp'+number),link=getElement('om-link'+number);
      return{name:name?name.value||'':'',link:link?link.value||'':''};
    });
    var workflow=root.querySelector&&root.querySelector('#rb-audit-version-workflow');
    var workflowJob=workflow&&String(workflow.getAttribute('data-job-id')||'').trim();
    var orderJob=String(order.id||'').trim();
    /* A modal can briefly contain the previous job's rendered Audit cards while
       the next job is loading. Never copy that DOM state into another order. */
    if(workflow&&workflowJob&&orderJob&&workflowJob===orderJob&&typeof window.rbCollectAuditVersionWorkflow==='function'){
      order.auditVersions=window.rbCollectAuditVersionWorkflow(workflow);
    }
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
