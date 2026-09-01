(function(root){
'use strict';
if(root._rbCollectionWriteGuardLoaded)return;
root._rbCollectionWriteGuardLoaded=true;
var VERSION='1.0.0';

function safeKey(value){return String(value||'').replace(/[.#$\[\]\/]/g,'_');}
function mapRows(rows){var out={};(Array.isArray(rows)?rows:[]).forEach(function(row){if(row&&row.id)out[String(row.id)]=row;});return out;}
function same(a,b){try{return JSON.stringify(a)===JSON.stringify(b);}catch(error){return false;}}
function write(path,value){if(typeof root.fbSet!=='function')return Promise.resolve(false);return Promise.resolve(root.fbSet(path,value));}

function installFacebookPageWriter(){
  if(typeof root._fpSave!=='function')return false;
  if(root._fpSave.__rbPerItem)return true;
  var replacement=function saveFacebookPagesPerItem(rows){
    rows=Array.isArray(rows)?rows:[];
    var before=mapRows(root._fpManual),after=mapRows(rows),writes=[];
    if(typeof root._fpSaveLocal==='function')root._fpSaveLocal(rows);
    Object.keys(after).forEach(function(id){if(!same(before[id],after[id]))writes.push(write('/fbpages_manual/'+safeKey(id),after[id]));});
    Object.keys(before).forEach(function(id){if(!after[id])writes.push(write('/fbpages_manual/'+safeKey(id),null));});
    if(!writes.length)return Promise.resolve(true);
    return Promise.all(writes).then(function(results){return results.every(function(result){return result!==false;});});
  };
  replacement.__rbPerItem=true;
  root._fpSave=replacement;
  return true;
}

function install(){if(!installFacebookPageWriter())setTimeout(install,250);else if(document.documentElement)document.documentElement.setAttribute('data-collection-write-guard',VERSION);}
root._rbCollectionWriteGuardTest={safeKey:safeKey,mapRows:mapRows,same:same,install:installFacebookPageWriter,version:VERSION};
install();
})(window);
