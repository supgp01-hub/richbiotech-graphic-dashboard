(function(w){
'use strict';
var labels={pending:'มอบหมาย',inprogress:'กำลังดำเนินการ',review:'รอตรวจ',revision:'ต้องแก้ไข',done:'เสร็จสมบูรณ์'};
function copy(v){return v==null?v:JSON.parse(JSON.stringify(v));}
function list(v){return Array.isArray(v)?v:[];}
function ref(o){return String(o&&(o._fbKey||o.id)||'');}
function text(v){return String(v==null?'':v);}
function esc(v){return text(v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function links(v){return list(v).map(text).filter(function(s){return s.trim();});}
function requests(o){return list(o.auditVersions).filter(function(v){return v&&Number(v.correctionRequestedAt)>0;}).map(function(v){return Number(v.correctionRequestedAt);}).sort(function(a,b){return a-b;});}
function payload(s){return JSON.stringify([s.by||'',links(s.links),links(s.imageLinks),s.note||'']);}
function legacy(o){
 var history=list(o.revisionSubmissions).filter(Boolean).slice().sort(function(a,b){return Number(a.at||0)-Number(b.at||0);}),events=[],groups=[],reqs=requests(o),lastReq=reqs.length?reqs[reqs.length-1]:0;
 // One footer decision stamps VERs a few milliseconds apart. It is one cycle.
 var req=lastReq?Math.min.apply(null,reqs.filter(function(t){return lastReq-t<1000;})):0;
 if(Number(o.firstSubmittedAt)>0)events.push({id:'legacy-first',kind:'submitted',at:Number(o.firstSubmittedAt),by:o.firstSubmittedBy||o.assignee,legacy:true});
 history.forEach(function(s){
   if(!(Number(s.at)>0))return;
   var cycle=s.cycleId||(req&&Number(s.at)>=req?'legacy-request-'+req:''),previous=groups[groups.length-1];
   var match=cycle?groups.find(function(g){return g.cycleId===cycle;}):null;
   // Conservative compatibility for repeated legacy clicks. Never combine
   // different requests, people, evidence or submissions far apart in time.
   if(!match&&!cycle&&previous&&!previous.cycleId&&Number(s.at)-previous.at<=60000&&payload(s)===payload(previous.latest)&&!reqs.some(function(t){return t>previous.at&&t<=Number(s.at);}))match=previous;
   if(match){match.latest=s;match.attempts++;return;}
   groups.push({at:Number(s.at),cycleId:cycle,latest:s,attempts:1});
 });
 if(req)events.push({id:'legacy-request-'+req,kind:'correction_requested',at:req,by:list(o.auditVersions).find(function(v){return v&&v.correctionRequestedAt;})?.updatedBy||'Audit',legacy:true,cycleId:'legacy-request-'+req});
 groups.forEach(function(g,i){events.push({id:g.cycleId?g.cycleId+'/submission':'legacy-submission-'+g.at,cycleId:g.cycleId||'legacy-cycle-'+g.at,kind:'resubmitted',at:g.at,by:g.latest.by||o.assignee,note:g.latest.note||'',links:links(g.latest.links),imageLinks:links(g.latest.imageLinks),attempts:g.attempts,legacy:true,round:i+1});});
 events.sort(function(a,b){return a.at-b.at;});
 var hasIssue=list(o.auditVersions).some(function(v){return v&&(v.result==='issue'||v.correctionRequestedAt);});
 var valid=history.every(function(s){return Number(s.at)>0;});
 // Only number a legacy sequence where a first submission is recorded and
 // an outstanding review does not contradict missing correction history.
 var complete=Number(o.firstSubmittedAt)>0&&valid&&groups.every(function(g){return !!g.cycleId;})&&!(o.status==='review'&&hasIssue&&!groups.length);
 return {version:1,origin:'legacy',complete:complete,events:events};
}
function state(o){return o&&o.reviewRounds&&o.reviewRounds.version===1?copy(o.reviewRounds):legacy(o||{});}
function summary(o){
 var s=state(o),seen={},count=0;
 list(s.events).forEach(function(e){if(e.kind==='resubmitted'){var id=e.cycleId||e.id;if(!seen[id]){seen[id]=1;count++;}}});
 var first=list(s.events).some(function(e){return e.kind==='submitted';});
 return {corrections:count,complete:!!s.complete,reviewNumber:s.complete&&first?count+1:null,origin:s.origin,events:list(s.events)};
}
function label(o){var s=summary(o);if(o.status==='review')return s.reviewNumber?'รอตรวจครั้งที่ '+s.reviewNumber:'รอตรวจ • รอบไม่ยืนยัน';if(o.status==='revision'&&s.reviewNumber)return 'ต้องแก้ไข • รอบ '+(s.corrections+1);return labels[o.status]||o.status||'ไม่ระบุ';}
function countLabel(o){var s=summary(o);return s.complete?s.corrections+' ครั้ง':s.corrections?'พบประวัติ '+s.corrections+' ครั้ง':'ยังยืนยันไม่ได้';}
function append(s,e){if(!s.events.some(function(x){return x.id===e.id;}))s.events.push(e);}
function versions(o){return list(o.auditVersions).filter(function(v){return v&&v.result==='issue';}).map(function(v,i){return Number(v.version)||i+1;});}
function prepare(previous,row,user,now){
 if(!row||row._deleted)return;
 var submittedByAction=row._rbReviewSubmit===true;delete row._rbReviewSubmit;
 now=Number(now)||Date.now();user=user||{};
 if(!previous){if(!row.reviewRounds)row.reviewRounds={version:1,origin:'tracked',complete:['pending','inprogress'].indexOf(row.status)>=0,events:[]};return;}
 var oldHistory=list(previous.revisionSubmissions),newHistory=list(row.revisionSubmissions),added=newHistory.slice(oldHistory.length),changed=previous.status!==row.status;
 if(!changed&&!added.length)return;
 var s=state(previous),by=user.name||row._updatedBy||row.assignee||'',base={at:now,by:by};
 s.events=list(s.events);
 if(row.status==='revision'&&previous.status!=='revision'){
   var cycle='request-'+now+'-'+ref(row);
   append(s,Object.assign({},base,{id:cycle,cycleId:cycle,kind:'correction_requested',versions:versions(row),note:list(row.auditVersions).filter(function(v){return v&&v.result==='issue';}).map(function(v){return v.note||v.issueType||'';}).filter(Boolean).join(' · ')}));
 }
 if(row.status==='review'&&previous.status==='revision'&&added.length){
   var open=s.events.filter(function(e){return e.kind==='correction_requested';}).slice(-1)[0];
   var cycleId=open&&open.cycleId||'legacy-open-'+(requests(previous)[0]||previous.updatedAt||ref(previous));
   if(!open){s.complete=false;append(s,{id:cycleId,cycleId:cycleId,kind:'correction_requested',at:requests(previous)[0]||0,by:'Audit',legacy:true});}
   var latest=added[added.length-1];
   added.forEach(function(e){e.cycleId=cycleId;e.submissionId=cycleId+'/submission';});
   append(s,Object.assign({},base,{id:cycleId+'/submission',cycleId:cycleId,kind:'resubmitted',links:links(latest.links),imageLinks:links(latest.imageLinks),note:latest.note||'',versions:versions(previous)}));
 }else if(row.status==='review'&&previous.status!=='review'){
   var first=s.events.some(function(e){return e.kind==='submitted';});
   var hasPriorAudit=list(previous.auditVersions).some(function(v){return v&&(v.result==='issue'||v.result==='pass'||v.correctionRequestedAt);});
   if(submittedByAction&&!first&&['pending','inprogress'].indexOf(previous.status)>=0&&!hasPriorAudit&&!oldHistory.length){s.complete=true;append(s,Object.assign({},base,{id:'first-'+ref(row),kind:'submitted',links:links(row.submitLinks),imageLinks:links(row.imageSubmitLinks)}));}
   else{s.complete=false;append(s,Object.assign({},base,{id:'status-'+now,kind:'status_changed',note:'เปลี่ยนเป็นรอตรวจโดยไม่มีรายการส่งแก้ไขใหม่'}));}
 }
 if(row.status==='done'&&previous.status!=='done')append(s,Object.assign({},base,{id:'approved-'+now,kind:'approved'}));
 // Repeated submits while already in review belong to the current cycle.
 if(row.status==='review'&&previous.status==='review'&&added.length){
   var last=s.events.filter(function(e){return e.kind==='resubmitted';}).slice(-1)[0];
   if(last)added.forEach(function(e){e.cycleId=last.cycleId;e.submissionId=last.id;});
 }
 row.reviewRounds=s;
}
function signature(o){return JSON.stringify([o.reviewRounds||null,o.firstSubmittedAt||0,list(o.revisionSubmissions).map(function(e){return[e.at,e.cycleId];}),requests(o)]);}
function queued(o){return !!(w.rbOrderSync&&w.rbOrderSync.queue&&w.rbOrderSync.queue().some(function(op){return op.path==='/orders/'+ref(o);}));}
function appendCountCell(tr,o,pending){
 var cell=document.createElement('td');cell.className='rb-round-count-cell';cell.setAttribute('data-label','ส่งแก้แล้ว');
 var count=document.createElement('strong');count.textContent=pending?'รอยืนยันออนไลน์':countLabel(o);cell.appendChild(count);
 var button=document.createElement('button');button.type='button';button.className='rb-round-history-button';button.textContent='ดูประวัติ';button.setAttribute('aria-label','ดูประวัติรอบส่งตรวจ '+o.id);button.onclick=function(){show(ref(o));};cell.appendChild(button);tr.appendChild(cell);
}
var dialog=null,activeRef='',opener=null,renderedSignature='';
function permitted(o){var u=w._rbUser||{};return ['sup','audit','spec'].indexOf(u.role)>=0||['graphic','ads'].indexOf(u.role)>=0&&w.rbOrderMatchesAssignee&&w.rbOrderMatchesAssignee(o,u.name);}
function lookup(key){return list(typeof w.lpORD==='function'?w.lpORD():[]).find(function(o){return ref(o)===key;});}
function close(){if(dialog)dialog.close();activeRef='';if(opener&&opener.isConnected)opener.focus();}
function linkHtml(values,title){return links(values).filter(function(url){return /^https?:\/\//i.test(url);}).map(function(url,i){return '<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+title+' '+(i+1)+' ↗</a>';}).join('');}
function renderHistory(o){
 renderedSignature=signature(o)+o.status+queued(o);
 var s=summary(o),n=0,pending=queued(o),titles={submitted:'ส่งงานครั้งแรก',correction_requested:'Audit ขอแก้ไข',approved:'ตรวจผ่าน',status_changed:'เปลี่ยนสถานะ'};
 dialog.querySelector('.rb-round-history-body').innerHTML='<div class="rb-round-history-summary"><strong>'+esc(label(o))+'</strong><span>ส่งแก้แล้ว '+esc(countLabel(o))+'</span></div>'+(pending?'<p role="status">มีข้อมูลรอซิงก์ • รอบล่าสุดยังไม่ยืนยันออนไลน์</p>':'')+(!s.complete?'<p>ประวัติเดิมไม่ครบ จึงยังยืนยันเลขครั้งที่ส่งตรวจทั้งหมดไม่ได้</p>':s.origin==='legacy'?'<p>จำนวนครั้งอ้างอิงประวัติที่บันทึกไว้ • รวมการส่งซ้ำในรอบเดียวกัน</p>':'')+'<ol>'+s.events.map(function(e){var title=e.kind==='resubmitted'?'พนักงานส่งแก้ครั้งที่ '+(++n):titles[e.kind]||'ประวัติงาน';var at=e.at?new Date(e.at).toLocaleString('th-TH',{dateStyle:'medium',timeStyle:'short'}):'ไม่ทราบเวลาเดิม';return '<li><strong>'+esc(title)+'</strong><small>'+esc(e.by||'ไม่ระบุผู้ทำรายการ')+' · '+esc(at)+(e.versions&&e.versions.length?' · VER '+esc(e.versions.join(', ')):'')+'</small>'+(e.note?'<div>'+esc(e.note)+'</div>':'')+(e.attempts>1?'<small>รวมการส่งซ้ำ '+e.attempts+' รายการในรอบนี้</small>':'')+'<div class="rb-round-links">'+linkHtml(e.links,'ลิงก์งาน')+linkHtml(e.imageLinks,'ลิงก์ภาพ')+'</div></li>';}).join('')+'</ol>'+(!s.events.length?'<p>ยังไม่มีประวัติส่งตรวจที่ยืนยันได้</p>':'');
}
function show(key){
 var o=lookup(key);if(!o||!permitted(o))return;
 if(!dialog){dialog=document.createElement('dialog');dialog.className='rb-round-history';dialog.setAttribute('aria-labelledby','rb-round-history-title');dialog.innerHTML='<header><div><h2 id="rb-round-history-title"></h2><small>นับเป็นรอบส่งงาน รวมทุก HOOK ในการส่งเดียวกัน</small></div><button type="button" aria-label="ปิดประวัติรอบส่งตรวจ">×</button></header><div class="rb-round-history-body"></div>';document.body.appendChild(dialog);dialog.querySelector('button').onclick=close;dialog.addEventListener('cancel',function(e){e.preventDefault();close();});dialog.addEventListener('click',function(e){if(e.target===dialog){var r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});}
 activeRef=key;opener=document.activeElement;dialog.querySelector('h2').textContent='ประวัติรอบส่งตรวจ · '+o.id;renderHistory(o);if(!dialog.open)dialog.showModal();
}
function refresh(){if(!activeRef||!dialog||!dialog.open)return;var o=lookup(activeRef);if(!o||!permitted(o)){close();return;}if(renderedSignature!==signature(o)+o.status+queued(o))renderHistory(o);}
w.rbReviewRounds={prepare:prepare,summary:summary,label:label,countLabel:countLabel,signature:signature,appendCountCell:appendCountCell,show:show,refresh:refresh};
})(window);
