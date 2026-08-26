(function(window,document){
  'use strict';

  var ISSUE_TYPES=['ชื่อแคมเปญไม่ตรง','ลิงก์เปิดไม่ได้ / สิทธิ์ไม่ครบ','ข้อมูลคอนเทนต์ไม่ครบ','รูปหรือข้อความไม่ถูกต้อง','ยังไม่ได้อัพข้อมูล','อื่นๆ'];

  function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(ch){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch];});}
  function role(){return window._rbUser&&window._rbUser.role||'';}
  function canAudit(){var current=role();return current==='sup'||current==='audit';}
  function isEmployee(){return role()==='graphic';}
  function fieldValue(id){var field=document.getElementById(id);return field?field.value||'':'';}
  function currentOrder(){var id=document.getElementById('om-id'),orders=typeof window.lpORD==='function'?window.lpORD():[];return id&&orders.find(function(order){return order.id===id.textContent;})||null;}
  function actor(){return window._rbUser&&window._rbUser.name||'';}
  function clone(value){try{return JSON.parse(JSON.stringify(value));}catch(error){return[];}}
  function initialVersions(order){
    var values=[{name:fieldValue('om-camp1'),link:fieldValue('om-uplink')},{name:fieldValue('om-camp2'),link:fieldValue('om-ad')}];
    var rows=document.querySelectorAll('#om-camp-extra .om-camp-row');
    Array.prototype.forEach.call(rows,function(row,index){var number=index+3;values.push({name:fieldValue('om-camp'+number),link:fieldValue('om-link'+number)});});
    var saved=order&&Array.isArray(order.auditVersions)?clone(order.auditVersions):[];
    var length=Math.max(values.length,saved.length,2),result=[];
    for(var index=0;index<length;index++){
      var old=saved[index]||{},source=values[index]||{};
      result.push({version:index+1,name:source.name||old.name||'',link:source.link||old.link||'',result:old.result||'pending',issueType:old.issueType||'',note:old.note||'',auditImages:Array.isArray(old.auditImages)?old.auditImages:[],fixImages:Array.isArray(old.fixImages)?old.fixImages:[],updatedAt:old.updatedAt||0,updatedBy:old.updatedBy||''});
    }
    return result;
  }
  function statusText(value){return value==='pass'?'✓ ผ่าน':value==='issue'?'✕ ต้องแก้ไข':'○ รอตรวจ';}
  function statusClass(value){return value==='pass'?'is-pass':value==='issue'?'is-issue':'is-pending';}
  function validUrl(value){return /^https?:\/\//i.test((value||'').trim());}
  function copyText(value,button){
    function done(){var old=button.textContent;button.textContent='✓';button.classList.add('is-copied');setTimeout(function(){button.textContent=old;button.classList.remove('is-copied');},1200);}
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(value).then(done).catch(function(){});return;}
    var temp=document.createElement('textarea');temp.value=value;temp.style.position='fixed';temp.style.opacity='0';document.body.appendChild(temp);temp.select();try{document.execCommand('copy');done();}catch(error){}temp.remove();
  }

  function compress(file,done){
    var reader=new FileReader();
    reader.onload=function(event){
      var image=new Image();
      image.onload=function(){var max=960,width=image.width,height=image.height;if(width>max||height>max){if(width>=height){height=Math.round(height*max/width);width=max;}else{width=Math.round(width*max/height);height=max;}}var canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;canvas.getContext('2d').drawImage(image,0,0,width,height);done({name:file.name,size:file.size,data:canvas.toDataURL('image/jpeg',0.68),at:Date.now(),by:actor()});};
      image.onerror=function(){done({name:file.name,size:file.size,data:event.target.result,at:Date.now(),by:actor()});};image.src=event.target.result;
    };reader.readAsDataURL(file);
  }
  function addFiles(files,target,done){var list=Array.prototype.slice.call(files||[]);if(!list.length)return;var pending=list.length;list.forEach(function(file){compress(file,function(image){target.push(image);pending--;if(!pending)done();});});}
  function renderImages(container,images,editable,onChange){
    container.innerHTML='';
    if(!images.length){var empty=document.createElement('span');empty.className='rb-av-empty';empty.textContent='ยังไม่แนบรูป';container.appendChild(empty);return;}
    images.forEach(function(image,index){var item=document.createElement('div');item.className='rb-av-thumb';var img=document.createElement('img');img.src=image.data;img.alt=image.name||('หลักฐาน '+(index+1));img.onclick=function(){window.open(image.data,'_blank','noopener');};item.appendChild(img);if(editable){var remove=document.createElement('button');remove.type='button';remove.title='ลบรูป';remove.textContent='×';remove.onclick=function(){images.splice(index,1);onChange();};item.appendChild(remove);}container.appendChild(item);});
  }
  function optionHtml(current){return '<option value="">-- เลือกประเภทปัญหา --</option>'+ISSUE_TYPES.map(function(item){return '<option value="'+esc(item)+'"'+(item===current?' selected':'')+'>'+esc(item)+'</option>';}).join('');}

  function versionCard(state,index,mode,rerender){
    var card=document.createElement('article');card.className='rb-av-card '+statusClass(state.result);card.setAttribute('data-version-index',String(index));
    var url=validUrl(state.link)?state.link:'';
    card.innerHTML='<header class="rb-av-card-head"><div><b>VER '+(index+1)+'</b><span>'+esc(state.name||'ยังไม่ระบุชื่อแคมเปญ')+'</span></div><span class="rb-av-result '+statusClass(state.result)+'">'+statusText(state.result)+'</span></header>'+
      '<div class="rb-av-link"><span>'+esc(state.link||'ยังไม่มีลิงก์ตรวจ')+'</span>'+(url?'<button type="button" class="rb-av-copy" aria-label="คัดลอกลิงก์ VER '+(index+1)+'">▣</button><a href="'+esc(url)+'" target="_blank" rel="noopener" aria-label="เปิดลิงก์ VER '+(index+1)+'">↗</a>':'')+'</div>'+
      '<div class="rb-av-audit-fields"></div><div class="rb-av-evidence-grid"><section><div class="rb-av-evidence-title"><b>รูปข้อผิดพลาด · Audit</b><span>'+state.auditImages.length+' รูป</span></div><div class="rb-av-gallery rb-av-audit-gallery"></div></section><section><div class="rb-av-evidence-title"><b>หลักฐานแก้ไข · พนักงาน</b><span>'+state.fixImages.length+' รูป</span></div><div class="rb-av-gallery rb-av-fix-gallery"></div></section></div>';
    var copy=card.querySelector('.rb-av-copy');if(copy)copy.onclick=function(){copyText(state.link,this);};
    var fields=card.querySelector('.rb-av-audit-fields');
    if(mode==='audit'){
      var result=document.createElement('select');result.className='rb-av-result-input';result.innerHTML='<option value="pending">○ รอตรวจ</option><option value="pass">✓ ผ่าน</option><option value="issue">✕ ต้องแก้ไข</option>';result.value=state.result;result.onchange=function(){state.result=this.value;state.updatedAt=Date.now();state.updatedBy=actor();rerender();};
      var issue=document.createElement('select');issue.className='rb-av-issue-input';issue.innerHTML=optionHtml(state.issueType);issue.disabled=state.result!=='issue';issue.onchange=function(){state.issueType=this.value;state.updatedAt=Date.now();state.updatedBy=actor();};
      var note=document.createElement('textarea');note.className='rb-av-note-input';note.placeholder='ระบุว่าเวอร์ชันนี้ผิดอะไร และต้องแก้จุดใด...';note.value=state.note;note.disabled=state.result!=='issue';note.oninput=function(){state.note=this.value;state.updatedAt=Date.now();state.updatedBy=actor();};fields.append(result,issue,note);
      var auditUpload=document.createElement('label');auditUpload.className='rb-av-upload is-error';auditUpload.innerHTML='↑ แนบรูปข้อผิดพลาด<input type="file" accept="image/*" multiple hidden>';auditUpload.querySelector('input').onchange=function(){addFiles(this.files,state.auditImages,rerender);};fields.appendChild(auditUpload);
    }else if(state.result==='issue'){
      fields.innerHTML='<div class="rb-av-issue-summary"><b>'+esc(state.issueType||'ต้องแก้ไข')+'</b><span>'+esc(state.note||'กรุณาตรวจรายละเอียดและแนบหลักฐานหลังแก้ไข')+'</span></div>';
    }else{fields.innerHTML='<div class="rb-av-readonly-summary">'+(state.result==='pass'?'เวอร์ชันนี้ตรวจผ่านแล้ว':'กำลังรอ Audit ตรวจเวอร์ชันนี้')+'</div>';}
    var auditGallery=card.querySelector('.rb-av-audit-gallery'),fixGallery=card.querySelector('.rb-av-fix-gallery');
    renderImages(auditGallery,state.auditImages,mode==='audit',rerender);renderImages(fixGallery,state.fixImages,mode==='employee',rerender);
    if(mode==='employee'&&state.result==='issue'){
      var fixUpload=document.createElement('label');fixUpload.className='rb-av-upload is-fix';fixUpload.innerHTML='↑ อัปโหลดหลักฐานแก้ไข<input type="file" accept="image/*" multiple hidden>';fixUpload.querySelector('input').onchange=function(){addFiles(this.files,state.fixImages,function(){state.updatedAt=Date.now();state.updatedBy=actor();rerender();});};card.querySelector('.rb-av-evidence-grid section:last-child').appendChild(fixUpload);
    }
    return card;
  }

  function syncSourceStatus(){
    ['om-fbuplist','om-contentuplist'].forEach(function(id){var field=document.getElementById(id);if(!field)return;var option=Array.prototype.slice.call(field.options).find(function(item){return item.value==='ยังไม่ได้อัพ';});if(option)option.textContent='✕ ยังไม่ได้อัพ';});
  }
  function saveEmployee(section){
    var order=currentOrder();if(!order)return;order.auditVersions=window.rbCollectAuditVersionWorkflow(section);if(order.status==='revision')order.status='review';order.updatedAt=Date.now();order.auditProofSubmittedAt=Date.now();order.auditProofSubmittedBy=actor();var orders=window.lpORD(),index=orders.findIndex(function(item){return item.id===order.id;});if(index>=0)orders[index]=order;if(typeof window.spORD==='function')window.spORD(orders);if(typeof window.logTL==='function')window.logTL('📋 สั่งงาน','ส่งหลักฐานแก้ไข',order.id+' ส่งตรวจอีกครั้ง',{jn:order.name||order.title||'',jt:order.type||'',as:order.assignee||''});var message=section.querySelector('.rb-av-save-message');if(message){message.textContent='✓ บันทึกหลักฐานและส่งกลับให้ Audit ตรวจแล้ว';message.hidden=false;}if(typeof window.renderOrderStats==='function')window.renderOrderStats();
  }
  window.rbCollectAuditVersionWorkflow=function(section){
    if(!section||!Array.isArray(section._rbState))return[];
    return clone(section._rbState).map(function(item,index){item.version=index+1;return item;});
  };
  window.rbRenderAuditVersionWorkflow=function(order,force){
    var panel=document.getElementById('om2-p2-panel'),id=document.getElementById('om-id');if(!panel||!id)return;
    var signature=id.textContent+'|'+role()+'|'+document.querySelectorAll('#om-camp-extra .om-camp-row').length,old=document.getElementById('rb-audit-version-workflow');
    if(old&&old.getAttribute('data-signature')===signature&&!force)return;
    var carried=old&&Array.isArray(old._rbState)?window.rbCollectAuditVersionWorkflow(old):null;if(old)old.remove();
    order=order||currentOrder()||{};var states=carried||initialVersions(order),mode=canAudit()?'audit':isEmployee()?'employee':'readonly';
    var section=document.createElement('section');section.id='rb-audit-version-workflow';section.className='rb-audit-version-workflow mode-'+mode;section.setAttribute('data-signature',signature);section._rbState=states;
    section.innerHTML='<div class="rb-av-section-head"><div><h3>ตรวจแยกตามเวอร์ชัน</h3><p>ระบุผลตรวจและเก็บหลักฐานของแต่ละ VER แยกจากกัน</p></div><span>'+states.length+' เวอร์ชัน</span></div><div class="rb-av-cards"></div><div class="rb-av-save-message" hidden></div>';
    function rerender(){section._rbState=states;var cards=section.querySelector('.rb-av-cards');cards.innerHTML='';states.forEach(function(state,index){cards.appendChild(versionCard(state,index,mode,rerender));});}
    rerender();
    if(mode==='employee'){var save=document.createElement('button');save.type='button';save.className='rb-av-employee-save';save.textContent='✓ บันทึกหลักฐานและส่งตรวจอีกครั้ง';save.onclick=function(){saveEmployee(section);};section.appendChild(save);}
    var note=document.getElementById('om-audit-note'),target=note&&note.parentNode,parent=target&&target.parentNode;if(parent)parent.insertBefore(section,target);else panel.appendChild(section);
    panel.style.pointerEvents='auto';panel.style.opacity='1';section.style.pointerEvents='auto';
    if(mode!=='audit'){
      panel.querySelectorAll('input,select,textarea,button').forEach(function(control){
        if(!control.closest('#rb-audit-version-workflow')){
          control.disabled=true;
          control.style.pointerEvents='none';
          control.style.opacity='1';
        }
      });
    }
    section.querySelectorAll('input,select,textarea,button,label,a').forEach(function(control){control.style.pointerEvents='auto';if(mode!=='readonly'&&(control.tagName==='INPUT'||control.tagName==='SELECT'||control.tagName==='TEXTAREA'||control.tagName==='BUTTON'))control.disabled=false;});
    syncSourceStatus();
  };
  function schedule(force){[0,80,260].forEach(function(delay){setTimeout(function(){var modal=document.getElementById('rb-order-modal');if(modal&&modal.style.display!=='none')window.rbRenderAuditVersionWorkflow(currentOrder(),force);},delay);});}
  document.addEventListener('click',function(event){if(event.target&&event.target.closest&&event.target.closest('#rb-order-modal'))schedule(!!event.target.closest('#om-camp-extra'));},true);
  document.addEventListener('input',function(event){if(event.target&&event.target.closest&&event.target.closest('#om-camp-extra'))schedule(true);});
  document.addEventListener('change',function(event){if(event.target&&event.target.closest&&event.target.closest('#om-camp-extra'))schedule(true);});
})(window,document);
