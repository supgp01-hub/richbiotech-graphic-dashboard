(function(w){
  'use strict';
  w.ctCanManage=function(){var u=w._rbUser;return !!(u&&u.uid&&['sup','spec','audit'].includes(u.role));};
  function mount(){
    ['ctImportModal','ctImportCommit','ctImportUndoLast'].forEach(function(name){var original=w[name];if(!original||original._ctRoleGuard)return;w[name]=function(){if(!w.ctCanManage())return false;return original.apply(this,arguments);};w[name]._ctRoleGuard=true;});
    var allowed=w.ctCanManage();
    document.querySelectorAll('.ct-wrap [onclick]').forEach(function(el){
      if(/\b(ctModal|ctEdit|ctDel|ctImportModal|ctBulkSetBrand|ctBulkDelete)\s*\(/.test(el.getAttribute('onclick')||''))el.hidden=!allowed;
    });
    var bulk=document.getElementById('ct-bulk-bar');if(bulk)bulk.hidden=!allowed;
    if(!allowed)document.querySelectorAll('.ct-modal-bg,#ct-del-ov,#cti-bg').forEach(function(el){el.remove();});
  }
  w.ctPermissions={mount:mount};
  w.addEventListener('rb:auth-ready',mount);w.addEventListener('rb:auth-cleared',mount);
  mount();
})(window);
