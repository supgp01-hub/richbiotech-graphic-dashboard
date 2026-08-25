(function(root){
'use strict';

function readJson(key){
  try{return JSON.parse(root.localStorage.getItem(key)||'{}');}catch(error){return {};}
}

if(typeof root._fbNotifSave!=='function'){
  root._fbNotifSave=function(select){
    if(!select)return false;
    var name=select.getAttribute('data-name');
    if(!name)return false;
    var data=readJson('rb_fb_notif');
    if(select.value)data[name]=select.value;else delete data[name];
    try{
      root.localStorage.setItem('rb_fb_notif',JSON.stringify(data));
    }catch(error){
      if(root.rbStorageResilience)root.rbStorageResilience.relieve();
      try{root.localStorage.setItem('rb_fb_notif',JSON.stringify(data));}catch(retryError){return false;}
    }
    if(typeof root._fbRefreshPageSummary==='function')root._fbRefreshPageSummary();
    return true;
  };
}

root.rbAuditControls=function(scope){
  scope=scope||document;
  var controls=Array.prototype.slice.call(scope.querySelectorAll('[onclick],[onchange],[oninput],[onsubmit]'));
  var missing=[];
  controls.forEach(function(control){
    ['onclick','onchange','oninput','onsubmit'].forEach(function(attribute){
      var source=control.getAttribute(attribute)||'';
      var matcher=/window\.([A-Za-z_$][\w$]*)/g,match;
      while((match=matcher.exec(source))){
        if(typeof root[match[1]]!=='function')missing.push({name:match[1],attribute:attribute,element:control});
      }
    });
  });
  return {checked:controls.length,missing:missing};
};
})(window);
