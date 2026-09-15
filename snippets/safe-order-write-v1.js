(function(root){
'use strict';
function conflict(message){var error=new Error(message);error.code='RB_ORDER_CONFLICT';return error;}
function same(a,b){return JSON.stringify(a==null?null:a)===JSON.stringify(b==null?null:b);}
// Compare only the fields this operation intended to change. Never acknowledge
// a stale submission if even one submitted field differs from the server.
function firebaseValue(v){if(v==null)return null;if(typeof v!=='object')return v;var out=Object.create(null);Object.keys(v).sort().forEach(function(k){var value=firebaseValue(v[k]);if(value!==null)out[k]=value;});return Object.keys(out).length?out:null;}
function equal(a,b){return JSON.stringify(firebaseValue(a))===JSON.stringify(firebaseValue(b));}
function matches(remote,change,method){
  if(!remote||!change||remote._deleted||change._deleted)return false;
  var metadata=['updatedAt','_version','_updatedBy','_syncRevision','_lastWriteToken','_fbKey','_assetsLoaded','_assetsChanged','_rbCacheCompacted','_rbReviewSubmit'];
  var keys=Object.keys(change).filter(function(k){return metadata.indexOf(k)<0;});
  if(!keys.length)return String(method).toUpperCase()==='PATCH'&&Object.keys(change).some(function(k){return ['_fbKey','_assetsLoaded','_assetsChanged','_rbCacheCompacted','_rbReviewSubmit'].indexOf(k)>=0;});
  if(String(method).toUpperCase()==='PUT')keys=Array.from(new Set(keys.concat(Object.keys(remote).filter(function(k){return metadata.indexOf(k)<0;}))));
  return keys.every(function(k){return equal(remote[k],change[k]);});
}
async function write(url,options,request){
  var method=String(options.method||'GET').toUpperCase(),change=JSON.parse(options.body||'null');
  if(method==='DELETE')throw new Error('ลบงานผ่านรายการงานเท่านั้น เพื่อเก็บประวัติ');
  var response=await request(url,{headers:{'X-Firebase-ETag':'true'},signal:options.signal});
  if(!response.ok)return response;
  var remote=await response.json(),etag=response.headers.get('ETag');
  if(!etag)throw new Error('ยังตรวจเวอร์ชันออนไลน์ไม่ได้ กรุณาลองซิงก์ใหม่');
  if(remote&&remote._lastWriteToken&&remote._lastWriteToken===options.rbWriteToken)return new Response('{}',{status:200,headers:{'X-RB-Updated-At':String(remote.updatedAt||0)}});
  if(matches(remote,change,method))return new Response('{}',{status:200,headers:{'X-RB-Updated-At':String(remote.updatedAt||0)}});
  var next=method==='PATCH'?Object.assign({},remote||{},change||{}):change;
  // A newer record is safe to merge only if each field being edited still
  // equals the value the editor originally read (or the desired value).
  var base=options.rbBaseValues,fields=Object.keys(change||{}).filter(function(k){return ['updatedAt','_version','_updatedBy','_syncRevision','_lastWriteToken'].indexOf(k)<0;});
  var independent=method==='PATCH'&&remote&&!remote._deleted&&change&&!change._deleted&&base&&fields.length&&fields.every(function(k){return Object.prototype.hasOwnProperty.call(base,k)&&(equal(remote[k],base[k])||equal(remote[k],change[k]));});
  if(method==='PATCH'&&remote&&base&&fields.some(function(k){return Object.prototype.hasOwnProperty.call(base,k)&&!equal(remote[k],base[k])&&!equal(remote[k],change[k]);}))throw conflict('ช่องที่แก้มีข้อมูลออนไลน์ใหม่แล้ว เก็บข้อมูลที่กรอกไว้โดยไม่ทับข้อมูลใหม่');
  if(independent){options=Object.assign({},options,{rbBaseUpdatedAt:Number(remote.updatedAt||0)});next.updatedAt=Math.max(Date.now(),Number(remote.updatedAt||0)+1);}
  if(remote){
    if(options.rbBaseUpdatedAt==null&&!same(next,remote))throw conflict('รายการจากเวอร์ชันเก่า เก็บไว้รอตรวจและไม่เขียนทับออนไลน์');
    if(options.rbBaseUpdatedAt!=null&&Number(options.rbBaseUpdatedAt)!==Number(remote.updatedAt||0))throw conflict('ข้อมูลออนไลน์เปลี่ยนแล้ว เก็บรายการนี้ไว้รอตรวจ ไม่เขียนทับข้อมูลใหม่');
    if(Number(next&&next.updatedAt||0)<=Number(remote.updatedAt||0)&&!same(next,remote))throw conflict('ข้อมูลในเครื่องเก่ากว่าออนไลน์ เก็บรายการไว้และหยุดการเขียนทับ');
  }
  if(next){next._syncRevision=Number(remote&&remote._syncRevision||0)+1;if(options.rbWriteToken)next._lastWriteToken=options.rbWriteToken;}
  var committed=await request(url,{method:'PUT',headers:{'Content-Type':'application/json','if-match':etag},body:JSON.stringify(next),signal:options.signal});
  if(committed.ok)return new Response('{}',{status:200,headers:{'X-RB-Updated-At':String(next.updatedAt||0)}});
  return committed;
}
root.rbSafeOrderWrite={write:write,matches:matches,equal:equal};
})(window);
