(function(root){
'use strict';
function conflict(message){var error=new Error(message);error.code='RB_ORDER_CONFLICT';return error;}
function same(a,b){return JSON.stringify(a==null?null:a)===JSON.stringify(b==null?null:b);}
// Compare only the fields this operation intended to change. Never acknowledge
// a stale submission if even one submitted field differs from the server.
function equal(a,b){if(a==null||b==null)return a==null&&b==null;if(typeof a!=='object'||typeof b!=='object')return a===b;if(Array.isArray(a)!==Array.isArray(b))return false;var keys=Object.keys(a);return keys.length===Object.keys(b).length&&keys.every(function(k){return equal(a[k],b[k]);});}
function matches(remote,change,method){
  if(!remote||!change||remote._deleted||change._deleted)return false;
  var metadata=['updatedAt','_version','_updatedBy','_syncRevision','_lastWriteToken'];
  var keys=Object.keys(change).filter(function(k){return metadata.indexOf(k)<0;});
  if(!keys.length)return false;
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
  if(remote){
    if(options.rbBaseUpdatedAt==null&&!same(next,remote))throw conflict('รายการจากเวอร์ชันเก่า เก็บไว้รอตรวจและไม่เขียนทับออนไลน์');
    if(options.rbBaseUpdatedAt!=null&&Number(options.rbBaseUpdatedAt)!==Number(remote.updatedAt||0))throw conflict('ข้อมูลออนไลน์เปลี่ยนแล้ว เก็บรายการนี้ไว้รอตรวจ ไม่เขียนทับข้อมูลใหม่');
    if(Number(next&&next.updatedAt||0)<=Number(remote.updatedAt||0)&&!same(next,remote))throw conflict('ข้อมูลในเครื่องเก่ากว่าออนไลน์ เก็บรายการไว้และหยุดการเขียนทับ');
  }
  if(next){next._syncRevision=Number(remote&&remote._syncRevision||0)+1;if(options.rbWriteToken)next._lastWriteToken=options.rbWriteToken;}
  return request(url,{method:'PUT',headers:{'Content-Type':'application/json','if-match':etag},body:JSON.stringify(next),signal:options.signal});
}
root.rbSafeOrderWrite={write:write,matches:matches};
})(window);
