(function(window,document){
  'use strict';

  var ISSUE_TYPES=['ชื่อแคมเปญไม่ตรง','ลิงก์เปิดไม่ได้ / สิทธิ์ไม่ครบ','ข้อมูลคอนเทนต์ไม่ครบ','รูปหรือข้อความไม่ถูกต้อง','ยังไม่ได้อัพข้อมูล','อื่นๆ'];

  function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(ch){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch];});}
  function role(){return window._rbUser&&window._rbUser.role||'';}
  function canAudit(){var current=role();return current==='sup'||current==='audit';}
  function isEmployee(){var current=role();return current==='graphic'||current==='spec';}
  function actor(){return window._rbUser&&window._rbUser.name||'';}
  function canonicalName(value){
    var raw=String(value||'').trim().toLowerCase().replace(/\s+/g,'');
    var aliases={view:'view','วิว':'view',moss:'moss','มอส':'moss',dom:'dom','ดอม':'dom',ter:'ter','เตอร์':'ter',nune:'nune','นุ่น':'nune',jam:'jam','แจ๋ม':'jam',ball:'ball','บอล':'ball',nui:'nui','นุ้ย':'nui',mind:'mind','มายด์':'mind'};
    return aliases[raw]||raw;
  }
  function canSubmitCorrection(order){
    var current=role();
    if(current==='sup'||current==='spec')return true;
    return current==='graphic'&&canonicalName(order&&order.assignee)===canonicalName(actor());
  }
  function clone(value){try{return JSON.parse(JSON.stringify(value));}catch(error){return[];}}
  function fieldValue(id){var field=document.getElementById(id);return field?field.value||'':'';}
  function jobId(order){var id=document.getElementById('om-id');return String(order&&order.id||id&&id.textContent||'').trim();}
  function versionKey(id,version){return String(id||'')+':VER'+version;}
  function currentOrder(){var id=document.getElementById('om-id'),orders=typeof window.lpORD==='function'?window.lpORD():[];return id&&orders.find(function(order){return order.id===id.textContent;})||null;}
  function validUrl(value){return /^https?:\/\//i.test(String(value||'').trim());}
  function rowValues(selector){return Array.prototype.slice.call(document.querySelectorAll(selector)).map(function(input){return String(input.value||'').trim();});}
  function deliveryValues(order,kind){
    var selector=kind==='image'?'#om-image-submitlinks-rows .om-image-submitlink-row input':'#om-submitlinks-rows .om-submitlink-row input';
    var current=rowValues(selector),hasCurrent=current.some(Boolean);
    if(hasCurrent)return current;
    var history=order&&Array.isArray(order.revisionSubmissions)?order.revisionSubmissions:[],latest=history.length?history[history.length-1]:null;
    if(kind==='image')return clone(latest&&latest.imageLinks||order&&order.latestRevisionImageLinks||order&&order.imageSubmitLinks||[]);
    return clone(latest&&latest.links||order&&order.latestRevisionLinks||order&&order.submitLinks||(order&&order.submitLink?[order.submitLink]:[]));
  }
  function sourceValue(id,fallback){var value=fieldValue(id);return value||String(fallback||'');}
  function sameSource(saved,source){
    saved=saved||{};source=source||{};
    var savedName=String(saved.name||'').trim(),savedLink=String(saved.link||saved.workLink||saved.imageLink||'').trim();
    var sourceName=String(source.name||'').trim(),sourceLink=String(source.link||source.workLink||source.imageLink||'').trim();
    if(!savedName&&!savedLink)return false;
    return(!savedName||savedName===sourceName)&&(!savedLink||savedLink===sourceLink);
  }
  function initialVersions(order,savedOverride){
    order=order||{};
    var id=jobId(order),workLinks=deliveryValues(order,'work'),imageLinks=deliveryValues(order,'image');
    var values=[
      {name:sourceValue('om-camp1',order.camp1),link:sourceValue('om-uplink',order.upLink),workLink:workLinks[0]||'',imageLink:imageLinks[0]||''},
      {name:sourceValue('om-camp2',order.camp2),link:sourceValue('om-ad',order.adLink),workLink:workLinks[1]||'',imageLink:imageLinks[1]||''}
    ];
    var rows=document.querySelectorAll('#om-camp-extra .om-camp-row');
    Array.prototype.forEach.call(rows,function(row,index){var number=index+3,fallback=Array.isArray(order.campExtra)?order.campExtra[index]||{}:{};values.push({name:sourceValue('om-camp'+number,fallback.name),link:sourceValue('om-link'+number,fallback.link),workLink:workLinks[index+2]||'',imageLink:imageLinks[index+2]||''});});
    if(Array.isArray(order.campExtra)&&order.campExtra.length>rows.length){
      order.campExtra.slice(rows.length).forEach(function(item,index){var offset=index+rows.length+2;values.push({name:String(item&&item.name||''),link:String(item&&item.link||''),workLink:workLinks[offset]||'',imageLink:imageLinks[offset]||''});});
    }
    var saved=Array.isArray(savedOverride)?clone(savedOverride):Array.isArray(order.auditVersions)?clone(order.auditVersions):[];
    var savedByVersion={},savedLength=0;
    saved.forEach(function(item,index){
      var version=Number(item&&item.version)||index+1,itemJob=String(item&&item.jobId||'').trim(),itemKey=String(item&&item.versionKey||'').trim();
      var owned=itemJob?itemJob===id:(itemKey?itemKey===versionKey(id,version):false);
      if(!itemJob&&!itemKey)owned=sameSource(item,values[version-1]);
      if(owned){savedByVersion[version]=item||{};savedLength=Math.max(savedLength,version);}
    });
    var length=Math.max(values.length,workLinks.length,imageLinks.length,savedLength,2),result=[];
    for(var index=0;index<length;index++){
      var version=index+1,old=savedByVersion[version]||{},source=values[index]||{};
      var workLink=String(source.workLink||old.workLink||''),imageLink=String(source.imageLink||old.imageLink||'');
      result.push({
        jobId:id,version:version,versionKey:versionKey(id,version),
        name:String(source.name||old.name||''),link:String(source.link||old.link||workLink||imageLink||''),
        workLink:workLink,imageLink:imageLink,fixLink:String(old.fixLink||''),result:old.result||'pending',issueType:old.issueType||'',note:old.note||'',
        auditImages:Array.isArray(old.auditImages)?old.auditImages:[],fixImages:Array.isArray(old.fixImages)?old.fixImages:[],fixNote:old.fixNote||'',
        employeeSubmittedAt:old.employeeSubmittedAt||0,employeeSubmittedBy:old.employeeSubmittedBy||'',correctionRequestedAt:old.correctionRequestedAt||0,correctionDraftUpdatedAt:old.correctionDraftUpdatedAt||0,updatedAt:old.updatedAt||0,updatedBy:old.updatedBy||''
      });
    }
    return result;
  }
  function statusText(state){if(state.result==='pass')return'✓ ผ่าน';if(state.result==='issue'&&state.employeeSubmittedAt)return'○ ส่งแก้ไขแล้ว';if(state.result==='issue')return'✕ ต้องแก้ไข';return'○ รอตรวจ';}
  function statusClass(value){return value==='pass'?'is-pass':value==='issue'?'is-issue':'is-pending';}
  function optionHtml(current){return '<option value="">-- เลือกประเภทปัญหา --</option>'+ISSUE_TYPES.map(function(item){return '<option value="'+esc(item)+'"'+(item===current?' selected':'')+'>'+esc(item)+'</option>';}).join('');}
  function copyText(value,button){
    function done(){var old=button.innerHTML;button.innerHTML='✓';button.classList.add('is-copied');setTimeout(function(){button.innerHTML=old;button.classList.remove('is-copied');},1200);}
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(value).then(done).catch(function(){});return;}
    var temp=document.createElement('textarea');temp.value=value;temp.style.position='fixed';temp.style.opacity='0';document.body.appendChild(temp);temp.select();try{document.execCommand('copy');done();}catch(error){}temp.remove();
  }
  function linkRow(label,value){
    var row=document.createElement('div');row.className='rb-av-delivery-link'+(value?'':' is-empty');
    var name=document.createElement('b');name.textContent=label;var text=document.createElement('span');text.textContent=value||'ยังไม่มีลิงก์';text.title=value||'';row.append(name,text);
    if(validUrl(value)){var copy=document.createElement('button');copy.type='button';copy.setAttribute('aria-label','คัดลอก '+label);copy.textContent='▣';copy.onclick=function(){copyText(value,copy);};var open=document.createElement('a');open.href=value;open.target='_blank';open.rel='noopener';open.setAttribute('aria-label','เปิด '+label);open.textContent='↗';row.append(copy,open);}
    return row;
  }
  function compress(file,done){
    var reader=new FileReader();reader.onload=function(event){var image=new Image();image.onload=function(){var max=960,width=image.width,height=image.height;if(width>max||height>max){if(width>=height){height=Math.round(height*max/width);width=max;}else{width=Math.round(width*max/height);height=max;}}var canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;canvas.getContext('2d').drawImage(image,0,0,width,height);done({name:file.name,size:file.size,data:canvas.toDataURL('image/jpeg',0.68),at:Date.now(),by:actor()});};image.onerror=function(){done({name:file.name,size:file.size,data:event.target.result,at:Date.now(),by:actor()});};image.src=event.target.result;};reader.readAsDataURL(file);
  }
  function addFiles(files,target,done){var list=Array.prototype.slice.call(files||[]);if(!list.length)return;var pending=list.length;list.forEach(function(file){compress(file,function(image){target.push(image);pending--;if(!pending)done();});});}
  function renderImages(container,images,editable,onChange,context){
    container.innerHTML='';if(!images.length){var empty=document.createElement('span');empty.className='rb-av-empty';empty.textContent='ยังไม่แนบรูป';container.appendChild(empty);return;}
    images.forEach(function(image,index){var item=document.createElement('div');item.className='rb-av-thumb';var img=document.createElement('img');img.src=image.data;img.alt=image.name||('หลักฐาน '+(index+1));img.title='กดเพื่อดูรูปขนาดใหญ่';img.onclick=function(){if(typeof window.rbOpenEvidenceLightbox==='function')window.rbOpenEvidenceLightbox(images,index,context||{});else window.open(image.data,'_blank','noopener');};item.appendChild(img);if(editable){var remove=document.createElement('button');remove.type='button';remove.title='ลบรูป';remove.textContent='×';remove.onclick=function(){images.splice(index,1);onChange();};item.appendChild(remove);}container.appendChild(item);});
  }
  function syncDeliveryInput(state,index,value){
    state.fixLink=String(value||'').trim();
    var values=rowValues('#om-image-submitlinks-rows .om-image-submitlink-row input');while(values.length<=index)values.push('');values[index]=state.fixLink;
    if(typeof window._renderImageSubmitLinkRows==='function')window._renderImageSubmitLinkRows(values);
  }
  function auditEditor(state,index,rerender){
    var wrap=document.createElement('div');wrap.className='rb-av-audit-fields';
    var result=document.createElement('select');result.className='rb-av-result-input';result.setAttribute('aria-label','ผลตรวจ VER '+(index+1));result.innerHTML='<option value="pending">○ รอตรวจ</option><option value="pass">✓ ผ่าน</option><option value="issue">✕ ต้องแก้ไข</option>';result.value=state.result;result.onchange=function(){state.result=this.value;if(state.result!=='issue')state.employeeSubmittedAt=0;state.updatedAt=Date.now();state.updatedBy=actor();rerender();};
    var issue=document.createElement('select');issue.className='rb-av-issue-input';issue.setAttribute('aria-label','ประเภทปัญหา VER '+(index+1));issue.innerHTML=optionHtml(state.issueType);issue.value=state.issueType;issue.onchange=function(){state.issueType=this.value;state.updatedAt=Date.now();state.updatedBy=actor();};
    var note=document.createElement('textarea');note.className='rb-av-note-input';note.setAttribute('aria-label','รายละเอียดที่ต้องแก้ VER '+(index+1));note.placeholder='ระบุว่าเวอร์ชันนี้ผิดอะไร และต้องแก้จุดใด...';note.value=state.note;note.oninput=function(){state.note=this.value;state.updatedAt=Date.now();state.updatedBy=actor();};
    var upload=document.createElement('label');upload.className='rb-av-upload is-error';upload.innerHTML='↑ แนบรูปชี้ข้อผิดพลาด<input type="file" accept="image/*" multiple hidden>';upload.querySelector('input').onchange=function(){addFiles(this.files,state.auditImages,rerender);};
    function field(label,control,className){var group=document.createElement('div');group.className='rb-av-audit-field '+(className||'');var title=document.createElement('span');title.textContent=label;group.append(title,control);return group;}
    wrap.append(field('ผลตรวจ',result,'is-result'),field('เลือกประเภทปัญหา',issue,'is-issue-type'),field('ระบุรายละเอียดที่ต้องแก้',note,'is-note'),field('แนบรูปชี้ข้อผิดพลาด',upload,'is-upload'));return wrap;
  }
  function evidenceBlock(state,mode,rerender){
    var grid=document.createElement('div');grid.className='rb-av-evidence-grid';
    var audit=document.createElement('section');audit.innerHTML='<div class="rb-av-evidence-title"><b>รูปชี้ข้อผิดพลาด · Audit</b><span>'+state.auditImages.length+' รูป</span></div><div class="rb-av-gallery rb-av-audit-gallery"></div>';
    var fix=document.createElement('section');fix.innerHTML='<div class="rb-av-evidence-title"><b>หลักฐานแก้ไข · พนักงาน</b><span>'+state.fixImages.length+' รูป</span></div><div class="rb-av-gallery rb-av-fix-gallery"></div>';
    var common={jobId:state.jobId,version:state.version};
    grid.append(audit,fix);renderImages(audit.querySelector('.rb-av-gallery'),state.auditImages,mode==='audit',rerender,{jobId:common.jobId,version:common.version,source:'รูปชี้ข้อผิดพลาด · Audit'});renderImages(fix.querySelector('.rb-av-gallery'),state.fixImages,mode==='employee'&&state.result==='issue',rerender,{jobId:common.jobId,version:common.version,source:'หลักฐานแก้ไข · พนักงาน'});return grid;
  }
  function teamCorrection(state,index,mode,rerender){
    var stage=document.createElement('section');stage.className='rb-av-stage rb-av-stage-fix';
    stage.innerHTML='<div class="rb-av-stage-title"><b><i>3</i> ส่งงานแก้ไข</b><span>'+(state.employeeSubmittedAt?'ส่งแล้ว':'ยังไม่ส่ง')+'</span></div>';
    if(mode==='employee'&&state.result==='issue'){
      var link=document.createElement('input');link.type='url';link.className='rb-av-fix-link';link.placeholder='วางลิงก์งานแก้ไขของ VER '+(index+1);link.value=state.fixLink||'';link.oninput=function(){state.fixLink=this.value;state.employeeSubmittedAt=0;state.correctionDraftUpdatedAt=Date.now();};link.onchange=function(){syncDeliveryInput(state,index,this.value);};
      var upload=document.createElement('label');upload.className='rb-av-upload is-fix';upload.innerHTML='<b>↑ ลากรูปมาวาง หรือกดเลือกไฟล์</b><small>อัปได้หลายรูป · JPG / PNG / WEBP</small><input type="file" accept="image/*" multiple hidden>';upload.querySelector('input').onchange=function(){addFiles(this.files,state.fixImages,function(){state.employeeSubmittedAt=0;state.correctionDraftUpdatedAt=Date.now();rerender();});};
      ['dragenter','dragover'].forEach(function(name){upload.addEventListener(name,function(event){event.preventDefault();upload.classList.add('is-dragging');});});
      ['dragleave','drop'].forEach(function(name){upload.addEventListener(name,function(event){event.preventDefault();upload.classList.remove('is-dragging');if(name==='drop'&&event.dataTransfer)addFiles(event.dataTransfer.files,state.fixImages,function(){state.employeeSubmittedAt=0;state.correctionDraftUpdatedAt=Date.now();rerender();});});});
      var note=document.createElement('textarea');note.className='rb-av-fix-note';note.placeholder='หมายเหตุถึง Audit (ไม่บังคับ)';note.value=state.fixNote||'';note.oninput=function(){state.fixNote=this.value;state.employeeSubmittedAt=0;state.correctionDraftUpdatedAt=Date.now();};stage.append(upload,link,note);
    }else if(state.employeeSubmittedAt){var sent=document.createElement('div');sent.className='rb-av-submitted';sent.textContent='✓ '+(state.employeeSubmittedBy||'พนักงาน')+' ส่งงานแก้ไขแล้ว รอ Audit ตรวจ';stage.appendChild(sent);}
    else{var message=document.createElement('div');message.className='rb-av-readonly-summary';message.textContent=state.result==='pass'?'เวอร์ชันนี้ผ่านแล้ว':state.result==='pending'?'รอ Audit ตรวจ':'รอพนักงานส่งงานแก้ไข';stage.appendChild(message);}
    if(state.fixImages.length){var proof=document.createElement('div');proof.className='rb-av-fix-proof';proof.innerHTML='<div class="rb-av-evidence-title"><b>รูปงานแก้ไข</b><span>'+state.fixImages.length+' รูป</span></div><div class="rb-av-gallery rb-av-fix-gallery"></div>';stage.appendChild(proof);renderImages(proof.querySelector('.rb-av-gallery'),state.fixImages,mode==='employee'&&state.result==='issue',rerender,{jobId:state.jobId,version:state.version,source:'หลักฐานแก้ไข · พนักงาน'});}
    return stage;
  }
  function teamVersionCard(state,index,mode,rerender){
    var card=document.createElement('article');card.className='rb-av-card rb-av-team-card '+statusClass(state.result);card.setAttribute('data-version-index',String(index));
    card.innerHTML='<header class="rb-av-team-card-head"><div><div class="rb-av-version-line"><b>VER '+(index+1)+'</b><span class="rb-av-result '+statusClass(state.result)+'">'+statusText(state)+'</span></div><strong>'+esc(state.name||'ยังไม่ระบุชื่อแคมเปญ')+'</strong><small>แก้เฉพาะข้อมูลและหลักฐานของเวอร์ชันนี้</small></div></header><div class="rb-av-flow"></div>';
    var head=card.querySelector('.rb-av-team-card-head'),flow=card.querySelector('.rb-av-flow');
    var submitted=document.createElement('section');submitted.className='rb-av-stage rb-av-stage-source';submitted.innerHTML='<div class="rb-av-stage-title"><b><i>1</i> งานที่ส่ง</b><span>ข้อมูลเดียวกับแท็บส่งงาน</span></div><div class="rb-av-delivery-list"></div>';var links=submitted.querySelector('.rb-av-delivery-list');links.append(linkRow('ลิงก์แอด',state.workLink),linkRow('ลิงก์ภาพ',state.imageLink));head.appendChild(submitted);
    var audit=document.createElement('section');audit.className='rb-av-stage';audit.innerHTML='<div class="rb-av-stage-title"><b><i>2</i> สิ่งที่ Audit พบ</b><span>'+(state.auditImages.length?'มีรูปชี้จุดผิด '+state.auditImages.length+' รูป':'')+'</span></div>';
    if(state.result==='issue'){var issue=document.createElement('div');issue.className='rb-av-issue-summary';issue.innerHTML='<b>'+esc(state.issueType||'ต้องแก้ไข')+'</b><span>'+esc(state.note||'Audit ยังไม่ได้ระบุรายละเอียด')+'</span>';audit.appendChild(issue);}else{var summary=document.createElement('div');summary.className='rb-av-readonly-summary';summary.textContent=state.result==='pass'?'เวอร์ชันนี้ตรวจผ่านแล้ว':'กำลังรอ Audit ตรวจเวอร์ชันนี้';audit.appendChild(summary);}
    var proof=evidenceBlock(state,mode,rerender),proofSection=proof.querySelector('section:first-child');proofSection.classList.add('rb-av-inline-evidence');audit.appendChild(proofSection);
    flow.append(audit,teamCorrection(state,index,mode,rerender));return card;
  }
  function auditVersionCard(state,index,mode,rerender){
    var card=document.createElement('article');card.className='rb-av-card '+statusClass(state.result);card.setAttribute('data-version-index',String(index));
    card.innerHTML='<header class="rb-av-card-head"><div class="rb-av-audit-title-row"><b class="rb-av-version">VER '+(index+1)+'</b><span class="rb-av-campaign" title="'+esc(state.name||'')+'">'+esc(state.name||'ยังไม่ระบุชื่อแคมเปญ')+'</span><span class="rb-av-result '+statusClass(state.result)+'">'+statusText(state)+'</span></div><div class="rb-av-audit-source-row"><b>งานที่ส่ง</b><div class="rb-av-source-links"></div></div></header>';
    var sourceLinks=card.querySelector('.rb-av-source-links');sourceLinks.append(linkRow('แอด',state.workLink||state.link),linkRow('ภาพ',state.imageLink));
    if(mode==='audit')card.appendChild(auditEditor(state,index,rerender));
    else if(state.result==='issue'){var issue=document.createElement('div');issue.className='rb-av-issue-summary';issue.innerHTML='<b>'+esc(state.issueType||'ต้องแก้ไข')+'</b><span>'+esc(state.note||'กรุณาตรวจรายละเอียดและแนบหลักฐานหลังแก้ไข')+'</span>';card.appendChild(issue);}
    else{var summary=document.createElement('div');summary.className='rb-av-readonly-summary';summary.textContent=state.result==='pass'?'เวอร์ชันนี้ตรวจผ่านแล้ว':'กำลังรอ Audit ตรวจเวอร์ชันนี้';card.appendChild(summary);}
    card.appendChild(evidenceBlock(state,mode,rerender));
    if(state.employeeSubmittedAt){var correction=document.createElement('div');correction.className='rb-av-submitted rb-av-audit-correction';correction.innerHTML='<b>งานแก้ไขจาก '+esc(state.employeeSubmittedBy||'พนักงาน')+'</b><span>'+esc(state.fixNote||'แนบหลักฐานแก้ไขแล้ว รอตรวจซ้ำ')+'</span>';if(state.fixLink)correction.appendChild(linkRow('ลิงก์งานแก้ไข',state.fixLink));card.appendChild(correction);}
    return card;
  }
  function syncSourceStatus(){
    ['om-fbuplist','om-contentuplist'].forEach(function(id){var field=document.getElementById(id);if(!field)return;Array.prototype.slice.call(field.options).forEach(function(option){if(option.value==='ยังไม่ได้อัพ')option.textContent='✕ ยังไม่ได้อัพ';if(option.value==='อัพแล้วเรียบร้อย')option.textContent='✓ อัพแล้ว';});function applySourceStatus(){var value=String(field.value||'').replace(/[✕✓]/g,'').trim(),missing=value==='ยังไม่ได้อัพ',uploaded=value==='อัพแล้วเรียบร้อย'||value==='อัพแล้ว';field.classList.toggle('rb-source-status-missing',missing);field.classList.toggle('rb-source-status-pass',uploaded);field.classList.toggle('rb-source-status-empty',!missing&&!uploaded);field.style.setProperty('background',missing?'#fff0f2':uploaded?'#e9f9f0':'#fff','important');field.style.setProperty('color',missing?'#c81e3a':uploaded?'#087443':'#374151','important');field.style.setProperty('border-color',missing?'#ef4d5b':uploaded?'#20ae78':'#d1d5db','important');field.style.setProperty('font-weight',missing||uploaded?'800':'400','important');}if(field._applyStyle)field._applyStyle();applySourceStatus();if(field.getAttribute('data-rb-source-status-bound')!=='1'){field.addEventListener('change',applySourceStatus);field.setAttribute('data-rb-source-status-bound','1');}});
  }
  window.rbSyncAuditSourceStatus=syncSourceStatus;
  function collect(section){if(!section||!Array.isArray(section._rbState))return[];var id=String(section.getAttribute('data-job-id')||jobId(currentOrder())).trim();return clone(section._rbState).map(function(item,index){item.jobId=id;item.version=index+1;item.versionKey=versionKey(id,index+1);return item;});}
  window.rbCollectAuditVersionWorkflow=collect;
  function setMessage(section,message,kind){var box=section&&section.querySelector('.rb-av-save-message');if(!box)return;box.textContent=message;box.className='rb-av-save-message'+(kind==='error'?' is-error':'');box.hidden=false;}
  function saveEmployee(section,rerender){
    if(!section||section._rbSaving)return;var current=currentOrder();if(!current)return;var orders=clone(typeof window.lpORD==='function'?window.lpORD():[]),orderIndex=orders.findIndex(function(item){return item.id===current.id;}),order=orderIndex>=0?orders[orderIndex]:null;if(!order)return;var states=section._rbState||[],issues=states.filter(function(state){return state.result==='issue';});
    var incomplete=issues.filter(function(state){return !validUrl(state.fixLink)&&!state.fixImages.length;});if(incomplete.length){setMessage(section,'กรุณาแนบลิงก์หรือรูปงานแก้ไขของ '+incomplete.map(function(state){return'VER '+state.version;}).join(', '),'error');return;}
    var stale=issues.filter(function(state){return state.correctionRequestedAt&&state.employeeSubmittedAt<state.correctionRequestedAt&&state.correctionDraftUpdatedAt<=state.correctionRequestedAt;});if(stale.length){setMessage(section,'กรุณาอัปเดตลิงก์ รูป หรือหมายเหตุงานแก้ไขล่าสุดของ '+stale.map(function(state){return'VER '+state.version;}).join(', '),'error');return;}
    var now=Date.now(),imageLinks=rowValues('#om-image-submitlinks-rows .om-image-submitlink-row input');issues.forEach(function(state,index){while(imageLinks.length<state.version)imageLinks.push('');if(state.fixLink)imageLinks[state.version-1]=String(state.fixLink).trim();state.employeeSubmittedAt=now+index;state.employeeSubmittedBy=actor();});
    var workLinks=deliveryValues(order,'work');order.auditVersions=collect(section);order.revisionSubmissions=Array.isArray(order.revisionSubmissions)?order.revisionSubmissions.slice():[];order.revisionSubmissions.push({links:clone(workLinks),imageLinks:clone(imageLinks),note:issues.map(function(state){return'VER '+state.version+': '+String(state.fixNote||'ส่งหลักฐานแก้ไข').trim();}).join(' | '),by:actor(),at:now,source:'version-audit-correction'});order.latestRevisionLinks=clone(workLinks);order.latestRevisionImageLinks=clone(imageLinks);order.imageSubmitLinks=clone(imageLinks);if(order.status==='revision')order.status='review';order.updatedAt=now;order.auditProofSubmittedAt=now;order.auditProofSubmittedBy=actor();
    section._rbSaving=true;var saveButton=section.querySelector('.rb-av-employee-save');if(saveButton)saveButton.disabled=true;setMessage(section,'กำลังบันทึกและซิงก์ออนไลน์...');
    Promise.resolve(typeof window.spORD==='function'?window.spORD(orders):{ok:false}).then(function(result){if(!result||result.ok===false)throw new Error('ยังยืนยันการบันทึกออนไลน์ไม่ได้');var successMessage=result.online===false?'เก็บแบบร่างไว้แล้ว กำลังรอซิงก์ออนไลน์':'✓ บันทึกงานแก้ไขและส่งกลับให้ Audit แล้ว';if(typeof window.logTL==='function')window.logTL('📋 สั่งงาน','ส่งหลักฐานแก้ไข',order.id+' ส่งตรวจอีกครั้ง',{jn:order.name||order.title||'',jt:order.type||'',as:order.assignee||''});if(typeof window.renderOrderStats==='function')window.renderOrderStats();rerender();setMessage(document.getElementById('rb-team-version-workflow'),successMessage);}).catch(function(error){section._rbSaving=false;if(saveButton)saveButton.disabled=false;setMessage(section,'บันทึกไม่สำเร็จ: '+(error&&error.message||'กรุณาลองอีกครั้ง'),'error');});
  }
  function buildSection(panel,id,states,mode,surface,rerender){
    var section=document.createElement('section');section.id=id;section.className='rb-audit-version-workflow mode-'+mode+' surface-'+surface;section.setAttribute('data-job-id',jobId(currentOrder()));section._rbState=states;
    var issueCount=states.filter(function(state){return state.result==='issue';}).length;
    section.innerHTML='<div class="rb-av-section-head"><div><h3>'+(surface==='team'?'ติดตามและส่งงานแก้ไขตามเวอร์ชัน':'ตรวจและระบุข้อแก้ไขตามเวอร์ชัน')+'</h3><p>'+(surface==='team'?'งานที่ส่ง ผลตรวจ และหลักฐานแก้ไขใช้เลข VER ชุดเดียวกัน':'ผลตรวจจะซิงก์ไปให้พนักงานเห็นในแท็บส่งงานภาพทันที')+'</p></div><span>'+(issueCount?issueCount+' VER ต้องแก้':states.length+' เวอร์ชัน')+'</span></div><div class="rb-av-cards"></div><div class="rb-av-save-message" hidden></div>';
    var cards=section.querySelector('.rb-av-cards');states.forEach(function(state,index){cards.appendChild(surface==='team'?teamVersionCard(state,index,mode,rerender):auditVersionCard(state,index,mode,rerender));});
    if(surface==='team'&&mode==='employee'&&issueCount){var save=document.createElement('button');save.type='button';save.className='rb-av-employee-save';save.textContent='✓ ส่งงานแก้ไขตาม VER ให้ Audit ตรวจ';save.onclick=function(){saveEmployee(section,rerender);};section.appendChild(save);}
    if(surface==='audit'){var note=document.getElementById('om-audit-note'),target=note&&note.parentNode,parent=target&&target.parentNode;if(parent)parent.insertBefore(section,target);else panel.insertBefore(section,panel.firstChild);}
    else panel.insertBefore(section,panel.firstChild);
    return section;
  }
  window.rbRenderAuditVersionWorkflow=function(order,force){
    var auditPanel=document.getElementById('om2-p2-panel'),teamPanel=document.getElementById('om2-p4-panel'),id=document.getElementById('om-id');if(!auditPanel||!teamPanel||!id)return;
    order=order||currentOrder()||{};var currentJobId=jobId(order),oldAudit=document.getElementById('rb-audit-version-workflow'),oldTeam=document.getElementById('rb-team-version-workflow');
    var carried=null;[oldAudit,oldTeam].some(function(section){if(section&&section.getAttribute('data-job-id')===currentJobId&&Array.isArray(section._rbState)){carried=collect(section);return true;}return false;});if(oldAudit)oldAudit.remove();if(oldTeam)oldTeam.remove();
    var states=initialVersions(order,carried),auditMode=canAudit()?'audit':'readonly',teamMode=canSubmitCorrection(order)?'employee':'readonly',rendering=false;
    function rerender(){if(rendering)return;rendering=true;var audit=document.getElementById('rb-audit-version-workflow'),team=document.getElementById('rb-team-version-workflow');if(audit)audit.remove();if(team)team.remove();buildSection(auditPanel,'rb-audit-version-workflow',states,auditMode,'audit',rerender);buildSection(teamPanel,'rb-team-version-workflow',states,teamMode,'team',rerender);rendering=false;}
    rerender();syncSourceStatus();
  };
  window.rbValidateAuditVersionDecision=function(kind){
    var section=document.getElementById('rb-audit-version-workflow'),states=section&&section._rbState||[];
    /* The two footer buttons are the Audit user's final decision.  Per-VER
       controls are optional detail, not a form that must be completed in
       every column before work can move forward. */
    if(!states.length)return{ok:true};
    var populated=states.filter(function(state){return state.name||state.link||state.workLink||state.imageLink;});
    if(!populated.length)populated=states.slice(0,1);
    var now=Date.now(),generalNote=String(fieldValue('om-audit-note')||'').trim();
    if(kind==='issue'){
      var issues=states.filter(function(state){return state.result==='issue';});
      if(!issues.length&&populated.length){var target=populated[populated.length-1];target.result='issue';issues=[target];}
      issues.forEach(function(state,index){if(!state.issueType)state.issueType='อื่นๆ';if(!String(state.note||'').trim())state.note=generalNote||'กรุณาตรวจและแก้ไขงานเวอร์ชันนี้';state.correctionRequestedAt=now+index;state.employeeSubmittedAt=0;state.updatedAt=now+index;state.updatedBy=actor();});
    }
    if(kind==='pass')populated.forEach(function(state,index){state.result='pass';state.employeeSubmittedAt=0;state.updatedAt=now+index;state.updatedBy=actor();});
    return{ok:true};
  };
  function schedule(force){[0,100,320].forEach(function(delay){setTimeout(function(){var modal=document.getElementById('rb-order-modal');if(modal&&modal.style.display!=='none'){syncSourceStatus();window.rbRenderAuditVersionWorkflow(currentOrder(),force);}},delay);});}
  document.addEventListener('click',function(event){if(!event.target||!event.target.closest)return;if(event.target.closest('#rb-order-modal .rb-om-tab'))schedule(false);if(event.target.closest('#om-camp-extra'))schedule(true);},true);
  function isVersionSource(target){return !!(target&&target.id&&/^(om-camp\d+|om-link\d+|om-uplink|om-ad)$/.test(target.id));}
  document.addEventListener('input',function(event){if(event.target&&event.target.closest&&(event.target.closest('#om-camp-extra')||event.target.closest('#om-submitlinks-rows')||event.target.closest('#om-image-submitlinks-rows')||isVersionSource(event.target)))schedule(true);});
  document.addEventListener('change',function(event){if(event.target&&event.target.closest&&(event.target.closest('#om-camp-extra')||isVersionSource(event.target)))schedule(true);});
})(window,document);
