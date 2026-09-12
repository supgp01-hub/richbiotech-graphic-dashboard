(function(root){
'use strict';
function conflict(message){var error=new Error(message);error.code='RB_ORDER_CONFLICT';return error;}
function same(a,b){return JSON.stringify(a==null?null:a)===JSON.stringify(b==null?null:b);}
async function write(url,options,request){
  var method=String(options.method||'GET').toUpperCase(),change=JSON.parse(options.body||'null');
  if(method==='DELETE')throw new Error('ลบงานผ่านรายการงานเท่านั้น เพื่อเก็บประวัติ');
  var response=await request(url,{headers:{'X-Firebase-ETag':'true'},signal:options.signal});
  if(!response.ok)return response;
  var remote=await response.json(),etag=response.headers.get('ETag');
  if(!etag)throw new Error('ยังตรวจเวอร์ชันออนไลน์ไม่ได้ กรุณาลองซิงก์ใหม่');
  if(remote&&remote._lastWriteToken&&remote._lastWriteToken===options.rbWriteToken)return new Response('{}',{status:200});
  var next=method==='PATCH'?Object.assign({},remote||{},change||{}):change;
  if(remote){
    if(options.rbBaseUpdatedAt==null&&!same(next,remote))throw conflict('รายการจากเวอร์ชันเก่า เก็บไว้รอตรวจและไม่เขียนทับออนไลน์');
    if(options.rbBaseUpdatedAt!=null&&Number(options.rbBaseUpdatedAt)!==Number(remote.updatedAt||0))throw conflict('ข้อมูลออนไลน์เปลี่ยนแล้ว เก็บรายการนี้ไว้รอตรวจ ไม่เขียนทับข้อมูลใหม่');
    if(Number(next&&next.updatedAt||0)<=Number(remote.updatedAt||0)&&!same(next,remote))throw conflict('ข้อมูลในเครื่องเก่ากว่าออนไลน์ เก็บรายการไว้และหยุดการเขียนทับ');
  }
  if(next){next._syncRevision=Number(remote&&remote._syncRevision||0)+1;if(options.rbWriteToken)next._lastWriteToken=options.rbWriteToken;}
  return request(url,{method:'PUT',headers:{'Content-Type':'application/json','if-match':etag},body:JSON.stringify(next),signal:options.signal});
}
root.rbSafeOrderWrite={write:write};
})(window);
