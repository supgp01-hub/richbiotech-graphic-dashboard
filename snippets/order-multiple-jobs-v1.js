(function(w){
'use strict';
function norm(v){return String(v||'').normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();}
function hooks(job){return [job.hook||'',job.hook2||''].concat(job.hookExtra||[]);}
function groups(order){return [order||{}].concat(order&&order.jobExtra||[]);}
function names(order){return groups(order).map(function(g){return g.name||g.title||'';}).filter(Boolean).join(' / ');}
function describe(order){return groups(order).map(function(g){return (g.name||g.title||'')+': '+hooks(g).filter(Boolean).join(' • ');}).join(' / ');}
function aligned(select,index,remove){
 var row=select.parentElement;if(!row.classList.contains('rb-hook-field')){row=document.createElement('div');row.className='rb-hook-field';select.before(row);row.appendChild(select);var arrow=document.createElement('span');arrow.className='rb-hook-chevron';arrow.textContent='⌄';arrow.setAttribute('aria-hidden','true');row.appendChild(arrow);}
 select.setAttribute('aria-label','HOOK '+index);if(select.options[0]&&!select.options[0].value)select.options[0].textContent='— เลือก HOOK '+index+' —';
 if(remove&&!row.querySelector('button')){var del=document.createElement('button');del.type='button';del.className='rb-hook-remove';del.textContent='×';del.setAttribute('aria-label','ลบ HOOK');del.onclick=remove;row.appendChild(del);}return row;
}
function mount(host,initial,options){
 var list=document.createElement('div');list.className='rb-job-groups';host.appendChild(list);var add=document.createElement('button');add.type='button';add.className='rb-job-add';add.textContent='＋ เพิ่มชื่องาน';host.appendChild(add);var editors=[];
 function changed(){if(options.changed)options.changed();host.dispatchEvent(new Event('change',{bubbles:true}));}
 function number(){editors.forEach(function(e,i){e.label.textContent='ชื่องาน '+(i+2)+' (พนักงานกรอกภายหลังได้)';e.title.textContent='HOOK ของชื่องาน '+(i+2);e.name.setAttribute('aria-label','ชื่องาน '+(i+2));e.del.setAttribute('aria-label','ลบชื่องาน '+(i+2));});}
 function addGroup(saved){
  saved=saved||{};var group=document.createElement('section');group.className='rb-job-group';var left=document.createElement('div'),right=document.createElement('div'),label=document.createElement('label'),caption=document.createElement('span'),name=document.createElement(options.employee?'select':'input');left.className=right.className='rb-job-column';label.append(caption,name);left.append(label);if(!options.employee)name.placeholder='เลือกหรือกรอกชื่องาน';
  var dl=document.createElement('datalist');dl.id='rb-job-options-'+Math.random().toString(36).slice(2);if(!options.employee){name.setAttribute('list',dl.id);left.append(dl);}
  var del=document.createElement('button');del.type='button';del.className='rb-job-delete';del.textContent='ลบชื่องาน';left.append(del);var title=document.createElement('span'),stack=document.createElement('div');stack.className='rb-job-hooks';right.append(title,stack);var plus=document.createElement('button');plus.type='button';plus.className='rb-job-add';plus.textContent='＋ เพิ่ม HOOK';right.append(plus);group.append(left,right);list.append(group);
  var selects=[],scope='',stored=saved.contentBindings||[];var e={name:name,label:caption,title:title,del:del};editors.push(e);
  function rows(){return (options.rows()||[]).filter(function(r){return norm(r.brand)===norm(options.product());});}
  function refresh(keep){var value=name.value,all=rows(),names=Array.from(new Set(all.map(function(r){return r.name||r.episode||'';}).filter(Boolean)));if(options.employee){name.replaceChildren();[''].concat(names).concat(value&&!names.includes(value)?[value]:[]).forEach(function(v){var o=document.createElement('option');o.value=v;o.textContent=v||'เลือกชื่องาน';name.append(o);});name.value=value;}else{dl.replaceChildren();names.forEach(function(v){var o=document.createElement('option');o.value=v;dl.append(o);});}
   var next=norm(options.product())+'|'+norm(name.value),same=scope===next;var matches=all.filter(function(r){return norm(r.name||r.episode)===norm(name.value);});selects.forEach(function(s,i){var v=keep||same?s.value:'',opt=s.options[s.selectedIndex],id=opt&&opt.dataset.contentRowId;var savedBinding=stored.filter(function(b){return b.hook===v&&matches.some(function(r){return String(r.id)===String(b.id);});})[selects.slice(0,i).filter(function(x){return x.value===v;}).length];w.rbContentSelection.populate(s,matches,v,id||(savedBinding&&savedBinding.id));aligned(s,i+1);});scope=next;
  }
  function addHook(value){var s=document.createElement('select'),o=document.createElement('option');o.value=value||'';o.textContent=value||'';s.append(o);stack.append(s);selects.push(s);aligned(s,selects.length,selects.length>2?function(){selects=selects.filter(function(x){return x!==s;});s.parentElement.remove();selects.forEach(function(x,i){aligned(x,i+1);});changed();}:null);s.onchange=changed;}
  hooks(saved).forEach(addHook);if(options.employee){var opt=document.createElement('option');opt.value=saved.name||'';opt.textContent=opt.value;name.append(opt);}name.value=saved.name||'';refresh(true);
  name.addEventListener(options.employee?'change':'input',function(){refresh(false);changed();});plus.onclick=function(){addHook('');refresh(true);changed();};del.onclick=function(){editors=editors.filter(function(x){return x!==e;});group.remove();number();changed();};
  e.read=function(){var v=selects.map(function(s){return s.value;}),fields={product:options.product(),name:name.value,hook:v[0]||'',hook2:v[1]||'',hookExtra:v.slice(2)};return {name:fields.name,hook:fields.hook,hook2:fields.hook2,hookExtra:fields.hookExtra,contentBindings:w.rbContentSelection.bindings(options.rows(),fields,selects.map(function(s){var o=s.options[s.selectedIndex];return o&&o.dataset.contentRowId;}))};};
  e.targets=function(){return selects.map(function(s,i){var o=s.options[s.selectedIndex];return {slot:i+1,hook:s.value,id:o&&o.dataset.contentRowId||'',jobName:name.value,jobIndex:editors.indexOf(e)+2};});};e.refresh=refresh;number();
 }
 (initial||[]).forEach(addGroup);add.onclick=function(){addGroup({});changed();};return {read:function(){return editors.map(function(e){return e.read();});},targets:function(){return editors.flatMap(function(e){return e.targets();});},refresh:function(keep){editors.forEach(function(e){e.refresh(keep);});}};
}
w.rbMultipleJobs={mount:mount,aligned:aligned,groups:groups,names:names,describe:describe};
})(window);
