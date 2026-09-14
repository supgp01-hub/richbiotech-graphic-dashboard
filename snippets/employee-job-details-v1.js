(function(){
'use strict';
function code(v){return typeof window.rbOrderAssigneeCode==='function'?window.rbOrderAssigneeCode(v):String(v||'').trim().toUpperCase();}
function allowed(order,user){return !!(order&&user&&['graphic','ads','spec'].indexOf(user.role)>=0&&code(order.assignee)&&code(order.assignee)===code(user.name));}
function norm(v){return String(v||'').normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();}
function choices(rows,product,name){return rows.filter(function(r){return norm(r.brand)===norm(product)&&(!name||norm(r.name)===norm(name));});}
function references(rows,order,name,hook){
  var matches=choices(rows,order.product,name).filter(function(r){return r.name===name;});
  if(hook){var exact=matches.filter(function(r){return r.hook===hook;});if(exact.length)matches=exact;}
  var result={};[['rawLink','link'],['sheetLink','script']].forEach(function(pair){var values=Array.from(new Set(matches.map(function(r){return String(r[pair[1]]||'').trim();}).filter(Boolean)));result[pair[0]]=values.length===1?values[0]:values.length===0&&name===(order.name||order.title)?order[pair[0]]||'':'';});return result;
}
function mount(host,order,options){
  var old=document.getElementById('rb-employee-job-details');if(old)old.remove();
  if(!allowed(order,window._rbUser))return;
  var box=document.createElement('section');box.id='rb-employee-job-details';box.style.cssText='padding:16px;margin:0 0 16px;border:1px solid #c9dfdf;border-radius:12px;background:#f5fbfb;pointer-events:auto;color:#173e47;font:inherit;';
  var heading=document.createElement('h3');heading.textContent='ข้อมูลที่พนักงานกรอก';heading.style.cssText='margin:0 0 6px;font-size:16px';box.appendChild(heading);
  var hint=document.createElement('p');hint.textContent='เลือกชื่องานและ HOOK ตามสินค้า '+order.product+' แล้วกรอกบรีฟงานของคุณ';hint.style.cssText='margin:0 0 12px;font-size:14px';box.appendChild(hint);
  var grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px';box.appendChild(grid);
  function field(label,tag){var wrap=document.createElement('label');wrap.style.cssText='display:grid;gap:6px;font-size:14px';wrap.appendChild(document.createTextNode(label));var el=document.createElement(tag);el.style.cssText='width:100%;box-sizing:border-box;border:1px solid #bfd4d9;border-radius:8px;padding:10px;background:white;color:#173e47;font:inherit';wrap.appendChild(el);grid.appendChild(wrap);return el;}
  function fill(select,values,current,placeholder){select.replaceChildren();[''].concat(Array.from(new Set(values.concat(current?[current]:[])))).forEach(function(v){var opt=document.createElement('option');opt.value=v;opt.textContent=v||placeholder;select.appendChild(opt);});select.value=current||'';}
  var rows=options.rows(),name=field('ชื่องาน','select'),hook=field('HOOK 1','select'),hook2=field('HOOK 2 (ถ้ามี)','select');
  fill(name,choices(rows,order.product).map(function(r){return r.name;}),order.name==='รอพนักงานระบุชื่องาน'?'':order.name||order.title,'เลือกชื่องาน');
  function hookOptions(first,second){var matches=choices(rows,order.product,name.value).filter(function(r){return r.name===name.value;}),stored=order.contentBindings||[];[hook,hook2].forEach(function(select,i){var current=i?second:first,option=select.options[select.selectedIndex],preferred=option&&option.dataset.contentRowId;var saved=stored.find(function(b){return b.hook===current;});if(window.rbContentSelection)window.rbContentSelection.populate(select,matches,current,preferred||(saved&&saved.id));else fill(select,matches.map(function(r){return r.hook;}),current,'เลือก HOOK');});}
  function hooks(keep){hookOptions(keep?order.hook:'',keep?order.hook2:'');}
  hooks(true);name.onchange=function(){hooks(false);showReferences();};hook.onchange=function(){showReferences();};hook2.onchange=function(){showReferences();};
  function refreshChoices(){if(!box.isConnected)return;rows=options.rows();fill(name,choices(rows,order.product).map(function(r){return r.name;}),name.value,'เลือกชื่องาน');hookOptions(hook.value,hook2.value);hint.textContent='สินค้า '+order.product+' · '+new Set(choices(rows,order.product).map(function(r){return r.name;})).size+' ชื่องาน · เลือก HOOK แล้วกรอกบรีฟงานของคุณ';showReferences();}
  if(options.ready)Promise.resolve(options.ready).then(refreshChoices).catch(function(){hint.textContent='ยังโหลดชื่องานออนไลน์ไม่สำเร็จ กรุณาลองเปิดงานใหม่';});
  if(window._rbEmployeeContentListener)window.removeEventListener('rb:content-updated',window._rbEmployeeContentListener);
  window._rbEmployeeContentListener=refreshChoices;window.addEventListener('rb:content-updated',refreshChoices);
  var preset=field('เลือกบรีฟสำเร็จรูป','select');fill(preset,options.presets||[],'','เลือกข้อความสำเร็จรูป');preset.parentElement.style.gridColumn='1 / -1';
  var brief=field('บรีฟงาน / สไตล์ที่ต้องการ','textarea');brief.rows=4;brief.value=order.brief||'';brief.parentElement.style.gridColumn='1 / -1';preset.onchange=function(){if(preset.value){brief.value=preset.value;brief.focus();showReferences();}};brief.oninput=function(){showReferences();};
  box.readFields=function(){var fields={product:order.product,name:name.value,hook:hook.value,hook2:hook2.value},selected=window.rbContentSelection?window.rbContentSelection.bindings(rows,fields,[hook,hook2].map(function(select){var opt=select.options[select.selectedIndex];return opt&&opt.dataset.contentRowId;})):[],referenceRows=selected.length?rows.filter(function(r){return r.id===selected[0].id;}):rows;return Object.assign(references(referenceRows,order,name.value,hook.value),{contentBindings:selected,name:name.value||'รอพนักงานระบุชื่องาน',title:name.value||'รอพนักงานระบุชื่องาน',hook:hook.value,hook2:hook2.value,brief:brief.value});};
  function showReferences(){if(options.onChange)options.onChange(box.readFields());if(listContent)listContent.update();}
  var listContent=window.rbOrderListContent&&window.rbOrderListContent.mount(box,order,function(){return [hook,hook2].map(function(select,i){var opt=select.options[select.selectedIndex],bindings=box.readFields().contentBindings||[],binding=bindings.find(function(b){return b.hook===select.value;});return{slot:i+1,hook:select.value,id:opt&&opt.dataset.contentRowId||(binding&&binding.id)||''};});});
  showReferences();
  var feedback=document.createElement('p');feedback.setAttribute('role','status');feedback.style.fontSize='14px';box.appendChild(feedback);
  var save=document.createElement('button');save.type='button';save.textContent='บันทึกข้อมูลและ List Content';save.style.cssText='border:0;border-radius:8px;padding:11px 16px;color:white;background:#008781;font:inherit;cursor:pointer';box.appendChild(save);
  save.onclick=async function(){if(save.disabled)return;if(!allowed(order,window._rbUser)){feedback.textContent='แก้ไขได้เฉพาะงานที่คุณรับผิดชอบ';return;}if(!name.value){feedback.textContent='กรุณาเลือกชื่องาน';name.focus();return;}save.disabled=true;feedback.textContent='กำลังบันทึก...';try{await options.save(box.readFields());feedback.textContent='บันทึกแล้ว';}catch(e){feedback.textContent=e.message||'บันทึกไม่สำเร็จ กรุณาลองใหม่';}finally{save.disabled=false;}};
  var reload=document.createElement('button');reload.type='button';reload.textContent='อัปเดตชื่องานจากออนไลน์';reload.style.cssText='padding:7px 12px;margin-bottom:12px;border:1px solid #bfd4d9;border-radius:8px;background:white;color:#008781;font:inherit';hint.insertAdjacentElement('afterend',reload);
  reload.onclick=async function(){if(reload.disabled)return;reload.disabled=true;hint.textContent='กำลังโหลดชื่องานล่าสุด…';try{if(typeof window.refreshOrderContentFromCloud!=='function')throw new Error('unavailable');await window.refreshOrderContentFromCloud(order.product,true);refreshChoices();}catch(e){hint.textContent='โหลดออนไลน์ไม่สำเร็จ · ยังแสดงรายการเดิม กดอัปเดตเพื่อลองใหม่';}finally{reload.disabled=false;}};
  host.insertBefore(box,host.firstChild);
  hint.textContent='สินค้า '+order.product+' · '+new Set(choices(rows,order.product).map(function(r){return r.name;})).size+' ชื่องาน · พิมพ์ค้นหาในรายการได้';
}
window.rbEmployeeJobDetails={allowed:allowed,choices:choices,references:references,mount:mount,read:function(order){var box=document.getElementById('rb-employee-job-details');return box&&allowed(order,window._rbUser)?box.readFields():null;}};
})();
