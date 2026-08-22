(function(){
'use strict';
if(window._rbOrderLeaveGuardLoaded)return;
window._rbOrderLeaveGuardLoaded=true;

var EMPLOYEE={MOS:{id:'mos',name:'Moss'},DOM:{id:'dom',name:'Dom'},TER:{id:'ter',name:'Ter'},JAM:{id:'jam',name:'Jam'},NUNE:{id:'nun',name:'Nune'},BALL:{id:'bol',name:'Ball'}};
var LEAVE_TYPE={hol:{label:'วันหยุดรอบ',icon:'🌴'},vac:{label:'พักร้อน',icon:'☀️'},sick:{label:'ลาป่วย',icon:'🤒'},per:{label:'ลากิจ',icon:'📋'}};

function loadData(){
  if(window.LV_DATA&&typeof window.LV_DATA==='object')return window.LV_DATA;
  try{var saved=JSON.parse(localStorage.getItem('lv_dash_v5')||'null');return saved&&saved.d&&typeof saved.d==='object'?saved.d:{};}catch(error){return{};}
}
function dateParts(value){var match=String(value||'').match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);return match?{y:Number(match[1]),m:Number(match[2]),d:Number(match[3])}:null;}
function todayValue(now){var date=now instanceof Date?now:new Date();return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');}
function dayEntries(data,value){var parts=dateParts(value);if(!parts)return[];var keys=[parts.y+'-'+parts.m+'-'+parts.d,parts.y+'-'+String(parts.m).padStart(2,'0')+'-'+String(parts.d).padStart(2,'0')];for(var i=0;i<keys.length;i++){if(Array.isArray(data[keys[i]]))return data[keys[i]];}return[];}
function employeeId(entry){return String(entry&&entry.empId||entry&&entry.emp||entry&&entry.employee||'').trim().toLowerCase();}
function typeMeta(type){return LEAVE_TYPE[type]||{label:String(type||'วันหยุด'),icon:'📅'};}
function leaveOn(data,assignee,date,kind){var employee=EMPLOYEE[String(assignee||'').toUpperCase()];if(!employee)return[];return dayEntries(data,date).filter(function(entry){return employeeId(entry)===employee.id;}).map(function(entry){var type=typeMeta(entry.type||entry.t);return{kind:kind,date:date,type:entry.type||entry.t||'',label:type.label,icon:type.icon,employee:employee.name};});}
function check(assignee,deadline,now,data){
  var code=String(assignee||'').toUpperCase(),employee=EMPLOYEE[code]||null,today=todayValue(now),source=data&&typeof data==='object'?data:loadData(),conflicts=[];
  if(employee&&deadline)conflicts=leaveOn(source,code,deadline,'deadline');
  return{assignee:code,employee:employee,today:today,deadline:String(deadline||''),conflicts:conflicts,offToday:false,offDeadline:conflicts.length>0};
}
function validate(options){options=options||{};var result=check(options.assignee,options.deadline,options.now,options.data);result.enforce=options.enforce!==false;result.block=!!(result.enforce&&result.employee&&result.conflicts.length);return result;}
function formatDate(value){var parts=dateParts(value);if(!parts)return value||'-';return parts.d+'/'+parts.m+'/'+(parts.y+543);}
function conflictText(result){var grouped={};result.conflicts.forEach(function(item){var key=item.kind+'|'+item.date;if(!grouped[key])grouped[key]={kind:item.kind,date:item.date,types:[]};grouped[key].types.push(item.icon+' '+item.label);});return Object.keys(grouped).map(function(key){var item=grouped[key],when=item.kind==='today'?'วันนี้':'วัน Deadline '+formatDate(item.date);return when+': '+item.types.join(', ');}).join(' · ');}
function render(result){var host=document.getElementById('om-leave-guard');if(!host)return result;if(!result.employee){host.className='rb-order-leave-guard is-neutral';host.innerHTML='<b>ตรวจวันหยุดของ Deadline</b><span>เลือกผู้รับผิดชอบและวันที่ Deadline เพื่อเช็กวันหยุด</span>';return result;}if(!result.deadline){host.className='rb-order-leave-guard is-neutral';host.innerHTML='<b>เลือกวันที่ Deadline</b><span>ระบบจะตรวจว่าวันส่งงานตรงกับวันหยุดของ '+result.employee.name+' หรือไม่</span>';return result;}if(result.conflicts.length){host.className='rb-order-leave-guard is-blocked';host.innerHTML='<b>⚠ Deadline ตรงกับวันหยุดของ '+result.employee.name+'</b><span>'+conflictText(result)+' · กรุณาเปลี่ยนวันที่ Deadline ใหม่</span>';return result;}host.className='rb-order-leave-guard is-available';host.innerHTML='<b>✓ Deadline นี้ใช้งานได้</b><span>'+result.employee.name+' ไม่มีวันหยุดในวันที่ '+formatDate(result.deadline)+'</span>';return result;}
function refresh(){var assignee=document.getElementById('om-mb'),deadline=document.getElementById('om-dl'),result=check(assignee?assignee.value:'',deadline?deadline.value:'');if(assignee){assignee.style.borderColor='';assignee.style.borderWidth='';assignee.disabled=false;}if(deadline){deadline.style.borderColor=result.conflicts.length?'#ef4444':'';deadline.style.borderWidth=result.conflicts.length?'2px':'';}return render(result);}

window.rbCheckOrderLeave=check;
window.rbValidateOrderLeaveAssignment=validate;
window.rbRefreshOrderLeaveGuard=refresh;
window._rbOrderLeaveGuardTest={check:check,validate:validate,todayValue:todayValue,dayEntries:dayEntries,employee:EMPLOYEE};

document.addEventListener('change',function(event){if(event.target&&(/^(om-mb|om-dl)$/).test(event.target.id))refresh();});
document.addEventListener('input',function(event){if(event.target&&event.target.id==='om-dl')refresh();});
window.addEventListener('storage',function(event){if(event.key==='lv_dash_v5')refresh();});
})();
