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
    return order;
  };

  function imageDeliveryValues(){
    return Array.prototype.slice.call(document.querySelectorAll('#om-image-submitlinks-rows .om-image-submitlink-row input')).map(function(input){
      return(input.value||'').trim();
    }).filter(Boolean);
  }

  function makeAction(label,handler){
    var button=document.createElement('button');
    button.type='button';button.title=label;button.setAttribute('aria-label',label);button.textContent=label==='คัดลอกลิงก์'?'⧉':'↗';
    button.style.cssText='width:34px;height:34px;border:1px solid #54a887;border-radius:8px;background:#fff;color:#087f6f;font-size:17px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center';
    button.onclick=handler;
    return button;
  }

  function ensureImageDeliveryBox(panel){
    var box=document.getElementById('om-image-submitlink-box');
    if(box)return box;
    box=document.createElement('section');box.id='om-image-submitlink-box';box.setAttribute('aria-label','ลิงก์ส่งงานภาพ');
    box.style.cssText='display:none;margin:0 0 14px;padding:12px 14px;border:1px solid #9fd3c0;border-radius:11px;background:#eefaf5';
    var title=document.createElement('div');title.textContent='ลิงก์ส่งงานภาพ';title.style.cssText='font-size:12px;font-weight:800;color:#154e3c;margin-bottom:9px';
    var list=document.createElement('div');list.id='om-image-submitlink-list';list.style.cssText='display:grid;gap:7px';
    box.appendChild(title);box.appendChild(list);
    var upload=panel.querySelector('.rb-om-upload-zone'),host=upload?upload.parentNode:(panel.querySelector('.rb-om-section')||panel);
    host.insertBefore(box,upload||host.firstChild);
    return box;
  }

  window.rbSyncOrderDeliveryLinks=function(){
    var panel=document.getElementById('om2-p4-panel');if(!panel)return;
    var box=ensureImageDeliveryBox(panel),list=box.querySelector('#om-image-submitlink-list'),values=imageDeliveryValues();
    list.innerHTML='';box.style.display=values.length?'block':'none';
    values.forEach(function(url,index){
      var row=document.createElement('div'),label=document.createElement('strong'),link=document.createElement('a'),actions=document.createElement('div');
      row.style.cssText='display:grid;grid-template-columns:96px minmax(0,1fr) auto;gap:8px;align-items:center;padding:7px;border:1px solid #b7ddcf;border-radius:9px;background:#fff';
      label.textContent='ภาพ '+(index+1);label.style.cssText='font-size:11.5px;color:#176f4f;text-align:center';
      link.href=url;link.target='_blank';link.rel='noopener';link.textContent=url;link.style.cssText='min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#175b4a;text-decoration:none;font-size:12px';
      actions.style.cssText='display:flex;gap:6px';
      actions.appendChild(makeAction('คัดลอกลิงก์',function(){var copy=navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(url):Promise.reject();copy.catch(function(){var input=document.createElement('textarea');input.value=url;document.body.appendChild(input);input.select();document.execCommand('copy');input.remove();});}));
      actions.appendChild(makeAction('เปิดลิงก์',function(){window.open(url,'_blank','noopener');}));
      row.appendChild(label);row.appendChild(link);row.appendChild(actions);list.appendChild(row);
    });
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
