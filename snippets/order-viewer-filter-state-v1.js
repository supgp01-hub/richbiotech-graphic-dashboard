(function(root){
'use strict';
function context(){
  var user=root._rbUser||null,isGraphic=!!(user&&user.role==='graphic');
  var code=isGraphic?(root.rbOrderAssigneeCode(user.name)||'__none__'):'';
  return{user:user,isGraphic:isGraphic,code:code,key:user?String(user.uid||'')+'|'+String(user.role||'')+'|'+root.rbOrderAssigneeCode(user.name):'guest'};
}
function rows(source,ctx){
  var list=Array.isArray(source)?source:[],viewer=ctx||context();
  return viewer.isGraphic?list.filter(function(order){return root.rbOrderMatchesAssignee(order,viewer.code);}):list.slice();
}
function reset(ctx){
  var viewer=ctx||context(),filters=root._OF;
  if(!filters)return;
  filters.status='';filters.type='';filters.search='';filters.dl='';filters.assignee='';filters.date='';filters.activeCard='all';filters.sort='priority';
  var search=document.getElementById('ord-search'),date=document.getElementById('ord-fst'),type=document.getElementById('ord-type-filter'),sort=document.getElementById('ord-sort');
  if(search)search.value='';if(date)date.value='';if(type)type.value='';if(sort)sort.value='priority';
  if(date&&date.parentNode){var clear=date.parentNode.querySelector('button');if(clear)clear.style.display='none';}
  var chips=document.getElementById('ord-chip-row');if(chips)chips.querySelectorAll('button').forEach(function(chip){chip.style.background='white';chip.style.color='#374151';chip.style.borderColor='#d1d5db';});
  root._rbOrderLockedAssignee=viewer.isGraphic?viewer.code:'';
}
function ensure(panel){
  var viewer=context(),previous=panel?panel.getAttribute('data-order-viewer-key'):null;
  if(panel&&previous!==viewer.key){reset(viewer);panel.setAttribute('data-order-viewer-key',viewer.key);}
  return viewer;
}
root.rbOrderViewerContext=context;
root.rbOrdersForViewer=rows;
root.rbResetOrderFiltersForViewer=reset;
root.rbEnsureOrderViewerState=ensure;
})(window);
