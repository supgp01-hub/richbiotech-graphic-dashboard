(function(w,d){
'use strict';
var session=null;
function user(){return w._rbUser||{};}
function code(v){return w.rbOrderAssigneeCode?w.rbOrderAssigneeCode(v):String(v||'').trim().toUpperCase();}
function allowed(){return ['sup','spec','graphic'].indexOf(user().role)>=0&&!!user().name;}
function own(o){return allowed()&&(!o||code(o.assignee)===code(user().name));}
function ge(id){return d.getElementById(id);}
function clone(v){return JSON.parse(JSON.stringify(v));}
function active(){return !!session;}
function editable(){return session&&own(session.order)&&(!session.order||session.order.status==='inprogress');}
function el(tag,text){var e=d.createElement(tag);if(text)e.textContent=text;return e;}
function button(text,fn){var b=el('button',text);b.type='button';b.onclick=fn;return b;}
function set(id,value){var e=ge(id);if(!e)return;if(e.tagName==='SELECT'&&!Array.from(e.options).some(function(o){return o.value===value;})){var o=el('option',value);o.value=value;e.appendChild(o);}e.value=value||'';}
function snapshot(){return session?{rows:clone(session.rows),sharedLink:session.sharedLink,deadline:session.deadline,note:session.note}:null;}
function begin(order,requested){
 var old=ge('rb-personal-work');if(old)old.remove();session=null;
 if(!(order&&order.personalTest)||(!order&&requested!==true)){if(!requested)return;}
 if(!order&&!allowed())throw new Error('ไม่มีสิทธิ์สร้างงานเทสส่วนตัว');
 if(order&&!order.personalTest)return;
 var prior=ge('rb-employee-job-details');if(prior)prior.remove();
 session={order:order?clone(order):null,rows:clone(order&&order.personalCampaigns||[{fbName:'',pageName:'',name:'',link:''}]),sharedLink:order&&order.imageSubmitLinks&&order.imageSubmitLinks[0]||'',deadline:order&&order.deadline||'',note:order&&order.note||'',desired:'inprogress'};
}
function restore(v){if(session&&v&&Array.isArray(v.rows)){session.rows=clone(v.rows);session.sharedLink=String(v.sharedLink||'');session.deadline=String(v.deadline||'');session.note=String(v.note||'');}}
function sync(){
 if(!session)return;
 var rows=session.rows;
 if(editable()){set('om-name','งานเทสส่วนตัว · '+(rows[0]&&rows[0].name||user().name));set('om-type','เทสส่วนตัว');set('om-mb',session.order?session.order.assignee:code(user().name));set('om-dl',session.deadline);set('om-note',session.note);}
 set('om-fbname',rows[0]&&rows[0].fbName);set('om-pagename',rows[0]&&rows[0].pageName);
 set('om-camp1',rows[0]&&rows[0].name);set('om-camp2',rows[1]&&rows[1].name);
 var extra=ge('om-camp-extra');if(extra){extra.replaceChildren();rows.slice(2).forEach(function(r,i){w._addCampRow();set('om-camp'+(i+3),r.name);set('om-link'+(i+3),r.link);});}
 w._renderSubmitLinkRows(rows.map(function(r){return r.link||'';}));w._renderImageSubmitLinkRows(session.sharedLink?[session.sharedLink]:[]);
 set('om-uplink',rows[0]&&rows[0].link);set('om-ad',rows[1]&&rows[1].link);
 if(w.rbRenderAuditVersionWorkflow)w.rbRenderAuditVersionWorkflow(session.order,true);
}
function change(){sync();var host=ge('rb-personal-work');if(host)host.dispatchEvent(new Event('input',{bubbles:true}));}
function field(text,value,fn,type){var label=el('label',text),i=el(type==='textarea'?'textarea':'input');if(type!=='textarea')i.type=type||'text';else i.rows=2;i.value=value||'';i.disabled=!editable();i.oninput=function(){fn(i.value);change();};label.appendChild(i);return label;}
function render(){
 var host=ge('rb-personal-work');if(!host||!session)return;host.replaceChildren();
 var meta=el('div');meta.className='rb-pt-meta';meta.appendChild(el('strong','ผู้รับผิดชอบ '+(session.order?session.order.assignee:code(user().name))));meta.appendChild(field('Deadline',session.deadline,function(v){session.deadline=v;},'date'));host.appendChild(meta);
 session.rows.forEach(function(row,index){var box=el('section');box.className='rb-pt-row';var head=el('div');head.className='rb-pt-row-head';head.appendChild(el('strong','VER '+(index+1)));if(editable()){var rm=button('−',function(){session.rows.splice(index,1);render();change();});rm.setAttribute('aria-label','ลบแคมเปญ VER '+(index+1));head.appendChild(rm);}box.appendChild(head);
 var grid=el('div');grid.className='rb-pt-grid';[['ชื่อเฟสบุ๊ค','fbName'],['ชื่อเพจ','pageName'],['แคมเปญ VER '+(index+1),'name'],['ลิงก์ยิงแอด VER '+(index+1),'link']].forEach(function(pair){grid.appendChild(field(pair[0],row[pair[1]],function(v){row[pair[1]]=v;},pair[1]==='link'?'url':'text'));});box.appendChild(grid);host.appendChild(box);});
 if(editable())host.appendChild(button('＋ เพิ่มแคมเปญ',function(){session.rows.push({fbName:'',pageName:'',name:'',link:''});render();change();}));
 host.appendChild(field('ลิงก์รวมงาน',session.sharedLink,function(v){session.sharedLink=v;},'url'));host.appendChild(field('หมายเหตุ',session.note,function(v){session.note=v;},'textarea'));
 if(session.order&&!editable())host.appendChild(el('small','ส่งตรวจแล้ว · ดูผลและส่งหลักฐานแก้ไขในแท็บส่งงาน/สรุปงาน'));
}
function mount(){
 var modal=ge('rb-order-modal');if(!modal)return;modal.classList.toggle('rb-personal-test',active());if(!session)return;
 var host=el('section');host.id='rb-personal-work';ge('om2-p1-panel').appendChild(host);ge('om-hd').textContent='งานเทสส่วนตัว';render();sync();footer('info');
}
function feedback(message){var e=ge('om-submit-feedback');if(e){e.textContent=message;e.style.display='block';}}
function prepare(){
 if(!session)return true;
 if(!editable()){feedback('ไม่สามารถแก้ไขข้อมูลต้นฉบับหลังส่งตรวจได้ ใช้ขั้นตอนส่งแก้ไขตามผลออดิต');return false;}
 var latest=session.order&&w.lpORD().find(function(o){return (o._fbKey||o.id)===(session.order._fbKey||session.order.id);});
 if(session.order&&(!latest||latest.status!==session.order.status)){feedback('สถานะงานเปลี่ยนแล้ว กรุณาเปิดงานใหม่ ข้อมูลที่กรอกยังอยู่ในหน้านี้');return false;}
 if(!session.rows.length||session.rows.some(function(r){return !r.fbName.trim()||!r.pageName.trim()||!r.name.trim();})){feedback('กรอกชื่อเฟสบุ๊ค ชื่อเพจ และแคมเปญให้ครบทุก VER');return false;}
 var urls=session.rows.map(function(r){return r.link;}).concat(session.sharedLink);if(urls.some(function(v){return v&&!/^https?:\/\/\S+$/i.test(v);})){feedback('ลิงก์ต้องขึ้นต้นด้วย https:// หรือ http:// และไม่มีช่องว่าง');return false;}
 if(session.desired==='review'&&session.rows.some(function(r){return !r.link.trim()&&!session.sharedLink.trim();})){feedback('แนบลิงก์ยิงแอดทุก VER หรือแนบลิงก์รวมงานก่อนส่งตรวจ');return false;}
 sync();set('om-st',session.desired);return true;
}
function persist(order){if(!session||!order)return;order.personalTest=true;if(user().role==='audit'||user().role==='sup'&&!editable()){var current=sources(order);order.personalCampaigns=current.map(function(r){return{fbName:r.fbName,pageName:r.pageName,name:r.name,link:r.link};});order.submitLinks=current.map(function(r){return r.link;});order.submitLink=order.submitLinks[0]||'';}if(editable()){order.personalCampaigns=clone(session.rows);order.type='เทสส่วนตัว';order.fbName=session.rows[0].fbName;order.pageName=session.rows[0].pageName;order.camp1=session.rows[0].name;order.camp2=session.rows[1]&&session.rows[1].name||'';order.campExtra=session.rows.slice(2).map(function(r){return{name:r.name,link:r.link};});order.createdBy=order.createdBy||user().name;if(order.status==='review'){order._rbReviewSubmit=true;if(!session.order){order.firstSubmittedAt=Date.now();order.firstSubmittedBy=user().name;order.reviewRounds={version:1,origin:'tracked',complete:true,events:[{id:'first-'+order.id,kind:'submitted',at:order.firstSubmittedAt,by:user().name,links:order.submitLinks,imageLinks:order.imageSubmitLinks}]};}}}}
function footer(tab){if(session&&!editable()&&tab!=='links'&&!(own(session.order)&&session.order&&session.order.status==='revision')){var p=ge('om-primary-btn'),b=ge('om-save-btn');if(p)p.style.display='none';if(b)b.style.display='none';return true;}if(!editable()||tab==='links')return false;var primary=ge('om-primary-btn'),draft=ge('om-save-btn');if(!primary||!draft)return false;primary.parentElement.style.display='flex';ge('om-audit-btns').style.display='none';primary.style.display='';primary.textContent='ส่งให้ออดิตตรวจ';primary.onclick=function(){session.desired='review';w.saveOrder(true);};draft.style.setProperty('display','inline-flex','important');draft.textContent='บันทึกฉบับร่าง';draft.onclick=function(){session.desired='inprogress';w.saveOrder(true);};return true;}
function sources(order){var current=session&&(!order||!session.order||order.id===session.order.id);var rows=current?session.rows:order&&order.personalCampaigns;var shared=current?session.sharedLink:order&&order.imageSubmitLinks&&order.imageSubmitLinks[0]||'';return Array.isArray(rows)?rows.map(function(r,i){var n=current&&(user().role==='audit'||user().role==='sup')&&ge('om-camp'+(i+1)),a=current&&(user().role==='audit'||user().role==='sup')&&ge(i===0?'om-uplink':i===1?'om-ad':'om-link'+(i+1));return{name:n?n.value:r.name,link:a?a.value:r.link,workLink:a?a.value:r.link,imageLink:shared,fbName:r.fbName,pageName:r.pageName};}):null;}
function installButton(){var target=ge('ord-add-btn');if(!target)return;var b=ge('rb-personal-add');if(!b){b=button('＋ งานเทสส่วนตัว',function(){if(!allowed())return;w.openOM(null,true);});b.id='rb-personal-add';target.parentElement.appendChild(b);}b.hidden=!allowed();}
w.rbPersonalWork={begin:begin,active:active,restore:restore,snapshot:snapshot,mount:mount,prepare:prepare,persist:persist,footer:footer,sources:sources,allowed:allowed,committed:function(order){if(session)session.order=clone(order);},canSubmit:function(){return !session||(own(session.order)&&(!session.order||['pending','inprogress','revision'].includes(session.order.status)));}};
new MutationObserver(installButton).observe(d.documentElement,{childList:true,subtree:true});w.addEventListener('rb:auth-ready',installButton);w.addEventListener('rb:auth-cleared',function(){session=null;installButton();});installButton();
})(window,document);
