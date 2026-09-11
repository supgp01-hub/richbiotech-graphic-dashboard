(function(){
'use strict';
function code(v){return typeof window.rbOrderAssigneeCode==='function'?window.rbOrderAssigneeCode(v):String(v||'').trim().toUpperCase();}
function allowed(order,user){return !!(order&&user&&['graphic','ads','spec'].indexOf(user.role)>=0&&code(order.assignee)&&code(order.assignee)===code(user.name));}
function choices(rows,product,name){return rows.filter(function(r){return r.brand===product&&(!name||r.name===name);});}
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
  function hooks(keep){var values=choices(rows,order.product,name.value).filter(function(r){return r.name===name.value;}).map(function(r){return r.hook;}).filter(Boolean);fill(hook,values,keep?order.hook:'','เลือก HOOK');fill(hook2,values,keep?order.hook2:'','ไม่ระบุ');}
  hooks(true);name.onchange=function(){hooks(false);};
  if(options.ready)Promise.resolve(options.ready).then(function(){if(!box.isConnected)return;rows=options.rows();fill(name,choices(rows,order.product).map(function(r){return r.name;}),name.value,'เลือกชื่องาน');var values=choices(rows,order.product,name.value).filter(function(r){return r.name===name.value;}).map(function(r){return r.hook;}).filter(Boolean);fill(hook,values,hook.value,'เลือก HOOK');fill(hook2,values,hook2.value,'ไม่ระบุ');}).catch(function(){});
  var preset=field('เลือกบรีฟสำเร็จรูป','select');fill(preset,options.presets||[],'','เลือกข้อความสำเร็จรูป');preset.parentElement.style.gridColumn='1 / -1';
  var brief=field('บรีฟงาน / สไตล์ที่ต้องการ','textarea');brief.rows=4;brief.value=order.brief||'';brief.parentElement.style.gridColumn='1 / -1';preset.onchange=function(){if(preset.value){brief.value=preset.value;brief.focus();}};
  box.readFields=function(){return {name:name.value||'รอพนักงานระบุชื่องาน',title:name.value||'รอพนักงานระบุชื่องาน',hook:hook.value,hook2:hook2.value,brief:brief.value};};
  var feedback=document.createElement('p');feedback.setAttribute('role','status');feedback.style.fontSize='14px';box.appendChild(feedback);
  var save=document.createElement('button');save.type='button';save.textContent='บันทึกชื่องาน / HOOK / บรีฟ';save.style.cssText='border:0;border-radius:8px;padding:11px 16px;color:white;background:#008781;font:inherit;cursor:pointer';box.appendChild(save);
  save.onclick=async function(){if(save.disabled)return;if(!allowed(order,window._rbUser)){feedback.textContent='แก้ไขได้เฉพาะงานที่คุณรับผิดชอบ';return;}if(!name.value){feedback.textContent='กรุณาเลือกชื่องาน';name.focus();return;}save.disabled=true;feedback.textContent='กำลังบันทึก...';try{await options.save({name:name.value,title:name.value,hook:hook.value,hook2:hook2.value,brief:brief.value});feedback.textContent='บันทึกแล้ว';}catch(e){feedback.textContent=e.message||'บันทึกไม่สำเร็จ กรุณาลองใหม่';}finally{save.disabled=false;}};
  host.insertBefore(box,host.firstChild);
}
window.rbEmployeeJobDetails={allowed:allowed,choices:choices,mount:mount,read:function(order){var box=document.getElementById('rb-employee-job-details');return box&&allowed(order,window._rbUser)?box.readFields():null;}};
})();
