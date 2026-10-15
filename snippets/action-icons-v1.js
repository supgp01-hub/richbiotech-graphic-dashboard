(function(){
'use strict';
var d=document,link=d.createElement('link');link.rel='stylesheet';link.href='snippets/action-icons-v1.css?v=fix508';d.head.appendChild(link);
var edit='.rb-order-edit-btn,.rb-fbp-row-edit,[data-pc-edit],[data-sw-edit],[data-leave-edit],[data-combined-edit],[data-report-edit]';
var del='.rb-order-delete-btn,.rb-fbp-row-delete,[data-fpid],.ct-del,.ic-del-btn,.lv-edel,.rb-hook-remove,.rb-job-delete,[data-pc-delete],[data-sw-delete],[data-leave-delete],[data-combined-delete],[data-report-delete],[data-action="delete"],[data-action="remove-brief-image"]';
var owned=new WeakMap(),frame=0;
function kind(b){
 if(b.matches('.rb-av-thumb > button,#ic-tbody button[onclick*="_icRemovePhoto"]')){
  b.classList.add('rb-photo-remove');
  if(b.textContent!=='×')b.textContent='×';
  if(!b.hasAttribute('aria-label'))b.setAttribute('aria-label',b.title||'ลบรูป');
  return null;
 }
 var text=(b.textContent||'').replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF\uFE0F]/gu,'').trim(),label=b.getAttribute('aria-label')||b.title||'',action=b.getAttribute('onclick')||'';
 if(/^(?:บันทึก|กำลัง|ยกเลิก|เสร็จ|ต้องแก้ไข|ส่ง|กลับไป)/.test(text))return null;
 var k=b.matches(del)||/^ลบ/.test(text)||/^ลบ/.test(label)||/\b(?:ctDel|icDel|lvDelEntry)\s*\(/.test(action)?'delete':b.matches(edit)||/^แก้ไข/.test(text)||/^(?:Edit(?:\s|$)|แก้ไข)/i.test(label)?'edit':null;
 if(!k)return null;
 var labeled=/ลบที่เลือก|ลบรายการที่เลือก|ยืนยัน|confirm-delete|confirm-history-delete/.test(text+' '+b.id+' '+(b.getAttribute('data-action')||''));
 return {kind:k,labeled:labeled,label:label||text||(k==='edit'?'แก้ไข':'ลบ')};
}
function scan(){frame=0;d.querySelectorAll('button').forEach(function(b){var state=kind(b),old=owned.get(b);if(!state){if(old){b.classList.remove('rb-action-standard','rb-action-edit','rb-action-delete','rb-action-compact','rb-action-labeled');if(old.aria)b.removeAttribute('aria-label');if(old.title)b.removeAttribute('title');owned.delete(b);}return;}
 var next='rb-action-'+state.kind,compact=!state.labeled;
 if(!b.classList.contains('rb-action-standard'))b.classList.add('rb-action-standard');
 b.classList.toggle('rb-action-edit',state.kind==='edit');b.classList.toggle('rb-action-delete',state.kind==='delete');b.classList.toggle('rb-action-compact',compact);b.classList.toggle('rb-action-labeled',!compact);
 if(!old){old={aria:!b.hasAttribute('aria-label'),title:!b.hasAttribute('title')};owned.set(b,old);}
 if(old.aria&&b.getAttribute('aria-label')!==state.label)b.setAttribute('aria-label',state.label);
 if(old.title&&b.title!==state.label)b.title=state.label;
 });}
function queue(){if(!frame)frame=requestAnimationFrame(scan);}
var observer=new MutationObserver(queue);observer.observe(d.body,{childList:true,subtree:true,characterData:true});scan();
window.rbActionIcons={scan:scan,destroy:function(){observer.disconnect();if(frame)cancelAnimationFrame(frame);}};
})();
