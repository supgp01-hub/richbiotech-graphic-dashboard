(function(){
'use strict';
if(window.rbPageSizePagination)return;
var STORE='rb_page_sizes_v1',ALLOWED=[50,100,200],states={},timers={};
var configs={
  order:{panel:'[data-sub="order"]',body:'#ord-tw tbody'},
  commission:{panel:'[data-sub="commission"]',body:'tbody'},
  audit:{panel:'[data-sub="audit"]',body:'tbody'},
  idcard:{panel:'[data-sub="idcard"]',body:'#ic-tbody'}
};
function read(){try{var v=JSON.parse(localStorage.getItem(STORE)||'{}');return v&&typeof v==='object'?v:{};}catch(e){return{};}}
function normalize(v){v=parseInt(v,10);return ALLOWED.indexOf(v)>=0?v:50;}
function getSize(key){return normalize(read()[key]);}
function setSize(key,value){var all=read();all[key]=normalize(value);try{localStorage.setItem(STORE,JSON.stringify(all));}catch(e){}return all[key];}
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function numbers(page,pages){var out=[],from=Math.max(1,page-2),to=Math.min(pages,page+2);if(from>1)out.push(1);if(from>2)out.push('…');for(var i=from;i<=to;i++)out.push(i);if(to<pages-1)out.push('…');if(to<pages)out.push(pages);return out;}
function markup(key,total,page,size){
  var pages=Math.max(1,Math.ceil(total/size)),start=total?(page-1)*size+1:0,end=Math.min(page*size,total);
  var nums=numbers(page,pages).map(function(n){return n==='…'?'<span aria-hidden="true">…</span>':'<button type="button" class="rbps-btn '+(n===page?'is-active':'')+'" data-rbps-page="'+n+'" aria-label="หน้า '+n+'" '+(n===page?'aria-current="page"':'')+'>'+n+'</button>';}).join('');
  return '<div class="rbps-summary">แสดง '+start+'–'+end+' จาก '+total+' รายการ</div><div class="rbps-pages"><button type="button" class="rbps-btn" data-rbps-page="'+(page-1)+'" '+(page<=1?'disabled':'')+' aria-label="หน้าก่อนหน้า">‹</button>'+nums+'<button type="button" class="rbps-btn" data-rbps-page="'+(page+1)+'" '+(page>=pages?'disabled':'')+' aria-label="หน้าถัดไป">›</button><select class="rbps-size" data-rbps-size aria-label="จำนวนรายการต่อหน้า">'+ALLOWED.map(function(n){return'<option value="'+n+'"'+(n===size?' selected':'')+'>'+n+'/หน้า</option>';}).join('')+'</select></div>';
}
function eligibleRows(body){return Array.prototype.filter.call(body.children,function(row){return row.tagName==='TR'&&!row.classList.contains('rbps-empty')&&!row.hasAttribute('data-rbps-ignore');});}
function ensurePager(panel,key,anchor){var pager=panel.querySelector('.rbps-pager[data-rbps-key="'+key+'"]');if(!pager){pager=document.createElement('div');pager.className='rbps-pager';pager.setAttribute('data-rbps-key',key);(anchor||panel).insertAdjacentElement('afterend',pager);}return pager;}
function apply(key){
  var cfg=configs[key],panel=document.querySelector(cfg.panel);if(!panel)return;
  var body=panel.querySelector(cfg.body),size=getSize(key),state=states[key]||(states[key]={page:1});
  if(!body){var stale=panel.querySelector('.rbps-pager[data-rbps-key="'+key+'"]');if(stale)stale.remove();return;}
  var rows=eligibleRows(body),pages=Math.max(1,Math.ceil(rows.length/size));state.page=Math.max(1,Math.min(state.page||1,pages));var from=(state.page-1)*size,to=from+size;
  rows.forEach(function(row,index){row.hidden=index<from||index>=to;});
  var anchor=body.closest('table')||body.parentElement,pager=ensurePager(panel,key,anchor);pager.innerHTML=markup(key,rows.length,state.page,size);
}
function schedule(key,reset){if(reset&&(states[key]||(states[key]={page:1})).page!==1)states[key].page=1;clearTimeout(timers[key]);timers[key]=setTimeout(function(){apply(key);},40);}
function bind(key){
  var cfg=configs[key],panel=document.querySelector(cfg.panel);if(!panel||panel.getAttribute('data-rbps-bound')===key)return;
  panel.setAttribute('data-rbps-bound',key);states[key]=states[key]||{page:1};
  panel.addEventListener('click',function(event){var btn=event.target.closest('[data-rbps-page]');if(btn&&panel.contains(btn)){states[key].page=Math.max(1,parseInt(btn.getAttribute('data-rbps-page'),10)||1);apply(key);var table=panel.querySelector(cfg.body);if(table)(table.closest('table')||table).scrollIntoView({block:'start',behavior:'smooth'});return;}if(event.target.closest('button,[role="button"]'))schedule(key,true);});
  panel.addEventListener('change',function(event){if(event.target.matches('[data-rbps-size]')){setSize(key,event.target.value);states[key].page=1;apply(key);return;}if(!event.target.closest('.rbps-pager'))schedule(key,true);},true);
  panel.addEventListener('input',function(event){if(!event.target.closest('.rbps-pager'))schedule(key,true);},true);
  new MutationObserver(function(mutations){if(mutations.some(function(m){return m.target.closest&&m.target.closest('.rbps-pager');}))return;schedule(key,false);}).observe(panel,{childList:true,subtree:true});
  apply(key);
}
function init(){Object.keys(configs).forEach(bind);}
window.rbPageSizePagination={allowed:ALLOWED.slice(),get:getSize,set:setSize,markup:markup,apply:apply,refresh:init,reset:function(key){states[key]={page:1};apply(key);}};
window.rbPageSizeGet=getSize;window.rbPageSizeSet=setSize;window.rbPageSizeMarkup=markup;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(init,0);});else setTimeout(init,0);
document.addEventListener('click',function(event){if(event.target.closest('.gsnav-btn'))setTimeout(init,60);});
window.addEventListener('rb:content-updated',function(){schedule('order',false);});
})();
