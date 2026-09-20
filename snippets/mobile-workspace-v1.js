(function(w,d){
'use strict';
var mq=w.matchMedia('(max-width:900px)'),scheduled=false;
// Keep the original controls and handlers: only annotate the existing table DOM.
function tables(){
 d.querySelectorAll('main table:not(.ord-table):not(.rb-fbp-table)').forEach(function(table){
  var head=table.tHead;if(!head||!head.rows.length)return;
  var labels=Array.from(head.rows[head.rows.length-1].cells).map(function(c){return c.textContent.trim();});
  table.classList.add('rb-mobile-table');table.parentElement.classList.add('rb-mobile-table-wrap');
  Array.from(table.tBodies).forEach(function(body){Array.from(body.rows).forEach(function(row){
   var col=0;Array.from(row.cells).forEach(function(cell){
    if(cell.colSpan>1){cell.classList.add('rb-mobile-wide');col+=cell.colSpan;return;}
    cell.setAttribute('data-mobile-label',labels[col++]||'');
   });
  });});
 });
 var cal=d.querySelector('#tab-schedule .lv-cal');
 if(cal&&!d.getElementById('rb-mobile-calendar-view')){
  var label=d.createElement('label');label.className='rb-mobile-calendar-switch';label.textContent='มุมมองปฏิทิน';
  var select=d.createElement('select');select.id='rb-mobile-calendar-view';select.setAttribute('aria-label','มุมมองปฏิทิน');
  [['month','รายเดือน'],['list','รายการรายวัน']].forEach(function(pair){var o=d.createElement('option');o.value=pair[0];o.textContent=pair[1];select.appendChild(o);});
  select.addEventListener('change',function(){cal.classList.toggle('rb-mobile-agenda',select.value==='list');});label.appendChild(select);cal.before(label);
 }
}
function schedule(){if(scheduled||!mq.matches)return;scheduled=true;w.requestAnimationFrame(function(){scheduled=false;tables();});}
function viewport(){if(!mq.matches){d.documentElement.classList.remove('rb-mobile-keyboard');return;}var vv=w.visualViewport,h=vv?vv.height:w.innerHeight;
 d.documentElement.style.setProperty('--rb-mobile-height',Math.round(h)+'px');
 var edit=d.activeElement&&d.activeElement.matches('input,textarea,[contenteditable="true"]');
 d.documentElement.classList.toggle('rb-mobile-keyboard',!!(edit&&vv&&vv.scale===1&&h<w.innerHeight*.78));
}
function boot(){new MutationObserver(schedule).observe(d.body,{childList:true,subtree:true});schedule();viewport();}
mq.addEventListener('change',function(){schedule();viewport();});w.addEventListener('resize',viewport);
if(w.visualViewport)w.visualViewport.addEventListener('resize',viewport);
d.addEventListener('focusin',viewport);d.addEventListener('focusout',function(){setTimeout(viewport,0);});
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot);else boot();
})(window,document);
