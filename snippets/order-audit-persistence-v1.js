(function(window){
  'use strict';

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
})(window);
