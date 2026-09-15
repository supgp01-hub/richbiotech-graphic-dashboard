(function(){
'use strict';
var SYNC_PENDING='rb_ct_sync_pending_v1';
var BACKUP_KEY='rb_ct_backup_v1';
var DESTRUCTIVE_KEY='rb_ct_destructive_sync_v1';
var memoryPending=false,localDurable=true,generation=0,pendingRows=null;
var syncTimer=null,syncController=null,syncAttempts=0,syncActive=false;
window._ctMainPage=window._ctMainPage||1;
window._ctMainPageSize=window._ctMainPageSize||(window.rbPageSizeGet?window.rbPageSizeGet('links'):(parseInt(localStorage.getItem('rb_ct_page_size_v1'),10)||50));
function cloudUrl(){var base=typeof FB_DB!=='undefined'?FB_DB:'https://richbiotech-c4e41-default-rtdb.firebaseio.com';return base+'/content_tracker_v2.json'}
function trackerActive(){var team=document.getElementById('tab-team'),panel=document.querySelector('[data-sub="links"]');return !document.hidden&&!!team&&team.classList.contains('active')&&!!panel&&panel.classList.contains('gsp-active')&&!!panel.querySelector('#ct-tbody')}
function status(type,text,title){var e=document.getElementById('ct-sync-status');if(!e){var host=document.querySelector('.ct-header .ct-actions')||document.querySelector('.ct-header');if(!host)return;e=document.createElement('span');e.id='ct-sync-status';e.className='ct-sync-status';e.onclick=function(){window.ctSyncNow(true)};host.insertBefore(e,host.firstChild)}e.className='ct-sync-status '+type;e.textContent=text;e.title=title||'คลิกเพื่อซิงก์อีกครั้ง'}
function loadContentData(){if(memoryPending&&pendingRows)return pendingRows;if(Array.isArray(window._ctCloudRows))return window._ctCloudRows;if(typeof _ctData!=='undefined'&&Array.isArray(_ctData))return _ctData;try{return JSON.parse(localStorage.getItem('rb_olympplus_v1')||'[]')}catch(e){return []}}
function backupCurrentRows(next){try{var current=loadContentData();if(!current.length||JSON.stringify(current)===JSON.stringify(next))return;localStorage.setItem(BACKUP_KEY,JSON.stringify({items:current,createdAt:Date.now(),reason:'before_local_save'}))}catch(e){}}
function compactRows(items){return (Array.isArray(items)?items:[]).map(function(row){if(!row||typeof row!=='object'||Array.isArray(row))return row;var out={};Object.keys(row).forEach(function(key){var value=row[key];if(value!==''&&value!==null&&typeof value!=='undefined')out[key]=value});return out})}
function writeLocalRows(items){var rows=Array.isArray(items)?items:loadContentData();window._ctCloudRows=rows;try{localStorage.setItem('rb_olympplus_v1',JSON.stringify(rows));return true}catch(firstError){try{localStorage.setItem('rb_olympplus_v1',JSON.stringify(compactRows(rows)));return true}catch(secondError){return false}}}
function signalContentUpdated(){try{window.dispatchEvent(new CustomEvent('rb:content-updated'))}catch(e){}}
function localSave(items){backupCurrentRows(items);if(!writeLocalRows(items)){status('waiting','กำลังบันทึกออนไลน์','พื้นที่ในเครื่องไม่พอ ระบบกำลังบันทึกออนไลน์โดยตรง');return false}try{localStorage.setItem(SYNC_PENDING,String(Date.now()))}catch(e){}signalContentUpdated();return true}
function unpackCloud(data){return Array.isArray(data)?data:(data&&Array.isArray(data.items)?data.items:[])}
function longCloudFetch(options){var ctl=typeof AbortController!=='undefined'?new AbortController():null,timer=setTimeout(function(){if(ctl)ctl.abort()},90000),opts=options||{};if(ctl)opts.signal=ctl.signal;var transport=window.rbFirebaseAuth&&window.rbFirebaseAuth.fetch?window.rbFirebaseAuth.fetch:fetch;return transport(cloudUrl(),opts).then(function(response){clearTimeout(timer);if(!response.ok)throw new Error('HTTP '+response.status);return response},function(error){clearTimeout(timer);throw error})}
function cloudReadRows(){if(window.rbFirebaseAuth&&window.rbFirebaseAuth.fetch)return longCloudFetch({cache:'no-store'}).then(function(response){return response.json()}).then(unpackCloud);if(typeof window.fbGet!=='function')return Promise.resolve([]);return new Promise(function(resolve,reject){window.fbGet('/content_tracker_v2',function(error,data){if(error)reject(error);else resolve(unpackCloud(data))})})}
function consumeDestructiveAuthorization(){try{var at=Number(localStorage.getItem(DESTRUCTIVE_KEY)||0);localStorage.removeItem(DESTRUCTIVE_KEY);return at>0&&Date.now()-at<120000}catch(e){return false}}
function mergeById(remote,local){var result=(remote||[]).slice(),positions={};result.forEach(function(row,index){if(row&&row.id!=null)positions[String(row.id)]=index});(local||[]).forEach(function(row){var id=row&&row.id!=null?String(row.id):'';if(id&&Object.prototype.hasOwnProperty.call(positions,id)){var previous=result[positions[id]];result[positions[id]]=previous._productSplit449&&row.brand==='So Pink'?Object.assign({},row,{brand:previous.brand,_productSplit449:true}):row;}else result.push(row)});return result}
// Each write reads the authoritative collection with an ETag and preserves missing rows.
// Destructive authorization belongs to this operation, never a later append.
function writeProtectedRows(rows,destructive){return longCloudFetch({cache:'no-store',headers:{'X-Firebase-ETag':'true'}}).then(async function(response){var etag=response.headers.get('ETag');if(!etag)throw new Error('Missing sync version');var remote=unpackCloud(await response.json()),merged=destructive?rows:mergeById(remote,rows),payload={items:merged,updatedAt:Date.now(),source:'ct_reliable_'+Math.random().toString(36).slice(2,8)};await longCloudFetch({method:'PUT',headers:{'Content-Type':'application/json','if-match':etag},body:JSON.stringify(payload)});return merged})}

function cloudWriteRows(items){return writeProtectedRows(Array.isArray(items)?items:[],consumeDestructiveAuthorization())}
function schedule(delay){clearTimeout(syncTimer);syncTimer=setTimeout(function(){syncNow(false)},typeof delay==='number'?delay:450)}
function syncNow(manual){
 if(!window.ctCanManage||!window.ctCanManage())return Promise.resolve(false);
 if(manual){memoryPending=true;try{localStorage.setItem(SYNC_PENDING,String(Date.now()))}catch(e){}}
 if(window.rbMultiTab&&!window.rbMultiTab.isLeader()&&localDurable){status('local','รอซิงก์','แท็บหลักจะซิงก์ข้อมูลให้อัตโนมัติ');return Promise.resolve(false)}
 if(syncActive){schedule(300);return Promise.resolve(false)}
 if(typeof navigator!=='undefined'&&navigator.onLine===false){status('waiting','รออินเทอร์เน็ต');schedule(2500);return Promise.resolve(false)}
 syncActive=true;status('syncing','กำลังซิงก์...');var started=Date.now(),ticket=generation,rows=JSON.parse(JSON.stringify(loadContentData())),signature=JSON.stringify(rows);
 return cloudWriteRows(rows).then(function(merged){
  syncActive=false;syncAttempts=0;
  if(ticket!==generation||JSON.stringify(loadContentData())!==signature){memoryPending=true;try{localStorage.setItem(SYNC_PENDING,String(Date.now()))}catch(e){}schedule(200);return false}
  // Keep the acknowledged UNION, including old server rows, in both UI caches.
  // Writing the original small input here previously hid the old collection.
  if(typeof _ctData!=='undefined')_ctData=merged;
  if(!writeLocalRows(merged))try{localStorage.removeItem('rb_olympplus_v1')}catch(e){}
  memoryPending=false;pendingRows=null;localDurable=true;try{localStorage.removeItem(SYNC_PENDING)}catch(e){}
  signalContentUpdated();if(trackerActive()&&typeof ctRender==='function')ctRender();
  status('synced','ซิงก์แล้ว '+Math.max(1,Math.round((Date.now()-started)/100)/10)+' วิ.','ข้อมูลเดิมและข้อมูลใหม่รวมออนไลน์แล้ว '+merged.length+' รายการ');return true
 }).catch(function(){syncActive=false;memoryPending=true;syncAttempts++;status('waiting','รอซิงก์ใหม่','ซิงก์ไม่สำเร็จ ข้อมูลยังอยู่ ระบบจะลองใหม่อัตโนมัติ');schedule([1200,4000,12000][Math.min(syncAttempts-1,2)]);return false})
}
window.ctPersistContent=function(items){
 if(!window.ctCanManage||!window.ctCanManage())return Promise.resolve(false);
 var rows=JSON.parse(JSON.stringify(Array.isArray(items)?items:(typeof _ctData!=='undefined'&&Array.isArray(_ctData)?_ctData:loadContentData())));
 generation++;memoryPending=true;pendingRows=rows;if(typeof _ctData!=='undefined')_ctData=rows;
 try{localStorage.setItem(SYNC_PENDING,String(Date.now()))}catch(e){}
 localDurable=localSave(rows);var savedLocally=localDurable;
 return syncNow(false).then(function(ok){if(!ok&&!savedLocally)throw Error('ยังไม่ยืนยันออนไลน์ ข้อมูลยังอยู่ในหน้านี้ กรุณารอซิงก์ก่อนปิด');return {local:savedLocally,queued:!ok,cloud:ok}})
};
window.ctPendingCount=function(){return memoryPending||syncActive||localStorage.getItem(SYNC_PENDING)?1:0};
window.ctMemoryPending=function(){return memoryPending};
window.addEventListener('storage',function(e){
 if(e.key!==SYNC_PENDING||e.newValue||!memoryPending||!localDurable||syncActive)return;
 try{var confirmed=JSON.parse(localStorage.getItem('rb_olympplus_v1')||'[]');if(!Array.isArray(confirmed)||!pendingRows||!pendingRows.every(function(row){return confirmed.some(function(saved){return saved.id===row.id&&JSON.stringify(saved)===JSON.stringify(row)})}))return;
 memoryPending=false;pendingRows=null;window._ctCloudRows=confirmed;if(typeof _ctData!=='undefined')_ctData=confirmed;signalContentUpdated();if(trackerActive()&&typeof ctRender==='function')ctRender();
 }catch(error){}
});
window.addEventListener('beforeunload',function(e){if(memoryPending&&!localDurable){e.preventDefault();e.returnValue='';}});
window.ctSave=function(items){return window.ctPersistContent(items)};
window.ctAuthorizeDestructiveSync=function(){try{localStorage.setItem(DESTRUCTIVE_KEY,String(Date.now()))}catch(e){}};
window.ctSyncNow=function(){clearTimeout(syncTimer);return syncNow(true)};
window.ctMainPage=function(p){window._ctMainPage=Math.max(1,p);if(typeof ctRender==='function')ctRender();var box=document.querySelector('.ct-table-container');if(box)box.scrollIntoView({block:'start',behavior:'smooth'})};
window.ctMainPageSize=function(v){var n=parseInt(v,10);window._ctMainPageSize=[50,100,200].indexOf(n)>=0?n:50;window._ctMainPage=1;try{localStorage.setItem('rb_ct_page_size_v1',String(window._ctMainPageSize));}catch(e){}if(window.rbPageSizeSet)window.rbPageSizeSet('links',window._ctMainPageSize);if(typeof ctRender==='function')ctRender()};
window.ctRenderMainPager=function(total,start,shown,size){var table=document.querySelector('.ct-table-container');if(!table)return;var bottom=document.getElementById('ct-main-pager');if(!bottom){bottom=document.createElement('div');bottom.id='ct-main-pager';bottom.className='ct-main-pager ct-main-pager-bottom';table.insertAdjacentElement('afterend',bottom)}var pages=Math.max(1,Math.ceil(total/size)),page=Math.min(window._ctMainPage||1,pages),nums=[],from=Math.max(1,page-2),to=Math.min(pages,page+2);for(var i=from;i<=to;i++)nums.push('<button class="ct-main-page '+(i===page?'active':'')+'" onclick="ctMainPage('+i+')">'+i+'</button>');var html='<span><b>หน้า '+page+' จาก '+pages+'</b> · แสดง '+(total?start+1:0)+'–'+(start+shown)+' จาก '+total+' รายการ</span><span class="ct-main-pages"><button class="ct-main-page" '+(page<=1?'disabled':'')+' onclick="ctMainPage('+(page-1)+')">‹</button>'+nums.join('')+'<button class="ct-main-page" '+(page>=pages?'disabled':'')+' onclick="ctMainPage('+(page+1)+')">›</button><select class="ct-main-size" onchange="ctMainPageSize(this.value)"><option value="50"'+(size===50?' selected':'')+'>50/หน้า</option><option value="100"'+(size===100?' selected':'')+'>100/หน้า</option><option value="200"'+(size===200?' selected':'')+'>200/หน้า</option></select></span>';if(bottom._ctPagerHtml!==html){bottom.innerHTML=html;bottom._ctPagerHtml=html;}var top=document.getElementById('ct-main-pager-top');if(top&&top._ctPagerHtml!==html){top.innerHTML=html;top._ctPagerHtml=html;}if(!syncActive)status(localStorage.getItem(SYNC_PENDING)?'waiting':'synced',localStorage.getItem(SYNC_PENDING)?'รอซิงก์ใหม่':'ข้อมูลพร้อม')};
window.addEventListener('online',function(){if(localStorage.getItem(SYNC_PENDING))schedule(200)});
window.addEventListener('storage',function(e){if(e.key===SYNC_PENDING&&window.rbMultiTab&&window.rbMultiTab.isLeader()){schedule(200);return}if(e.key!=='rb_olympplus_v1'||localStorage.getItem(SYNC_PENDING))return;var items=loadContentData();if(typeof _ctData!=='undefined')_ctData=items;try{window.dispatchEvent(new CustomEvent('rb:content-updated'))}catch(x){}if(trackerActive()&&typeof ctRender==='function')ctRender()});
if(window.addEventListener)window.addEventListener('rb:leader-change',function(e){if(e.detail&&e.detail.leader&&trackerActive()&&localStorage.getItem(SYNC_PENDING))schedule(150)});
document.addEventListener('visibilitychange',function(){if(trackerActive()&&localStorage.getItem(SYNC_PENDING))schedule(300)});
if(localStorage.getItem(SYNC_PENDING))schedule(250);
})();
