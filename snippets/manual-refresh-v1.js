(function(){
'use strict';
var STALE_MS=20*60*1000;
var FB_CACHE='rb_fbpages_cache_v1';
var FB_REFRESHED='rb_fbpages_refreshed_v1';
var FB_CLOUD='/fbpages_base_snapshot';
var COMM_REFRESHED='rb_commission_refreshed_v1';
var FB_URL='https://docs.google.com/spreadsheets/d/1lw9ZR4rBIuR8LJkTVPJc4qCthdOyS7IapYwFozy9ILc/gviz/tq?tqx=out:csv&gid=524471345';

function load(key,fallback){try{var value=JSON.parse(localStorage.getItem(key)||'null');return value==null?fallback:value}catch(e){return fallback}}
function save(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch(e){}}
function stamp(key){try{localStorage.setItem(key,String(Date.now()))}catch(e){}}
function canRefresh(){var role=window._rbUser&&window._rbUser.role;return ['sup','spec','graphic','ads','audit'].indexOf(role)>=0}
function canRefreshCommission(){var role=window._rbUser&&window._rbUser.role;return role==='sup'||role==='spec'||role==='audit'}
function formatTime(value){var date=new Date(value);return date.toLocaleDateString('th-TH',{day:'2-digit',month:'2-digit',year:'2-digit'})+' '+date.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})}
function refreshStatus(id,key){var el=document.getElementById(id);if(!el)return;var value=Number(localStorage.getItem(key)||0);if(!value){el.textContent='ยังไม่ได้อัปเดตในเครื่องนี้';el.classList.add('rb-heavy-stale');return}var age=Date.now()-value;el.textContent=(age>STALE_MS?'ข้อมูลเกิน 20 นาที · ':'อัปเดต: ')+formatTime(value);el.classList.toggle('rb-heavy-stale',age>STALE_MS)}
function setButtons(selector,allowed){document.querySelectorAll(selector).forEach(function(button){button.hidden=!allowed;button.style.setProperty('display',allowed?'inline-flex':'none','important');button.setAttribute('aria-hidden',allowed?'false':'true')})}
function applyPermissions(){setButtons('#lfb-upd,#lfb2-upd',canRefresh());setButtons('[data-rb-heavy-refresh]',canRefreshCommission());refreshStatus('lfb-ts',FB_REFRESHED);refreshStatus('lfb2-ts','rb_listfacebook_refreshed_v1');refreshStatus('rb-commission-ts',COMM_REFRESHED)}

function csvRows(csv){var rows=[],row=[],field='',quoted=false;csv=String(csv||'');for(var i=0;i<csv.length;i++){var c=csv[i];if(c==='"'){if(quoted&&csv[i+1]==='"'){field+='"';i++}else quoted=!quoted}else if(c===','&&!quoted){row.push(field);field=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&csv[i+1]==='\n')i++;row.push(field);field='';if(row.some(function(v){return String(v).trim()}))rows.push(row);row=[]}else field+=c}row.push(field);if(row.some(function(v){return String(v).trim()}))rows.push(row);return rows}
function parsePages(csv){var rows=csvRows(csv);return rows.slice(1).map(function(cols){return{type:'',emp:(cols[3]||'').trim(),own:(cols[3]||'').trim(),prod:(cols[1]||'').trim(),st:(cols[2]||'').trim(),name:(cols[0]||'').trim(),fbid:(cols[4]||'').trim(),limit:(cols[14]||'').trim(),upd:(cols[16]||'').trim(),bal:(cols[17]||'').trim()}}).filter(function(row){return row.name})}
function pageKey(row){return String(row.fbid||'').trim().toLowerCase()||[row.name,row.prod].join('|').trim().toLowerCase()}
function mergePages(existing,incoming){var out=[],byKey={};(existing||[]).forEach(function(src){if(!src)return;var row=Object.assign({},src),key=pageKey(row);if(key&&!byKey[key]){byKey[key]=row;out.push(row)}});var added=0,updated=0;(incoming||[]).forEach(function(src){if(!src)return;var key=pageKey(src),row=byKey[key];if(!row){row=Object.assign({},src);if(key)byKey[key]=row;out.push(row);added++;return}var changed=false;Object.keys(src).forEach(function(k){if(src[k]!==''&&src[k]!=null&&row[k]!==src[k]){row[k]=src[k];changed=true}});if(changed)updated++});return{rows:out,added:added,updated:updated}}
function cloudGet(path){return new Promise(function(resolve){if(typeof window.fbGet!=='function'){resolve(null);return}window.fbGet(path,function(err,data){resolve(err?null:data)})})}
function cloudSet(path,value){if(typeof window.fbSet!=='function')return Promise.resolve(false);return Promise.resolve(window.fbSet(path,value))}
function snapshotRows(value){if(Array.isArray(value))return value.filter(Boolean);if(value&&value.items){if(Array.isArray(value.items))return value.items.filter(Boolean);return Object.keys(value.items).map(function(k){return value.items[k]}).filter(Boolean)}return[]}
function renderPages(rows){var root=document.getElementById('fbl-root');if(!root)return;var merged=window._fpMerge?window._fpMerge(rows):rows;if(window._renderFbList)window._renderFbList(root,merged);else root.innerHTML='<p style="text-align:center;padding:20px;color:#777">มีข้อมูล '+merged.length+' รายการ</p>'}

window.rbCanRefreshHeavy=canRefresh;
window.rbHeavyRefreshStatus=refreshStatus;
window.rbApplyHeavyRefreshPermissions=applyPermissions;

function initFbListManual(){window._fblDone=true;var cached=load(FB_CACHE,[]);if(cached.length)renderPages(cached);else{var root=document.getElementById('fbl-root');if(root)root.innerHTML='<div class="rb-heavy-empty">กำลังเปิดข้อมูลที่บันทึกไว้ในระบบ...</div>'}cloudGet(FB_CLOUD).then(function(snapshot){var merged=mergePages(load(FB_CACHE,[]),snapshotRows(snapshot)).rows;if(snapshot&&snapshot.updatedAt)try{localStorage.setItem(FB_REFRESHED,String(snapshot.updatedAt))}catch(e){}if(merged.length){save(FB_CACHE,merged);renderPages(merged)}else if(!cached.length){var root=document.getElementById('fbl-root');if(root)root.innerHTML='<div class="rb-heavy-empty">ยังไม่มีข้อมูลที่บันทึกไว้<br><span>ผู้มีสิทธิ์กด “อัปเดตข้อมูลล่าสุด” เพื่อเพิ่มข้อมูลจากต้นทาง</span></div>'}refreshStatus('lfb-ts',FB_REFRESHED)});refreshStatus('lfb-ts',FB_REFRESHED);applyPermissions()}
function fetchFbPagesManual(){var button=document.getElementById('lfb-upd'),ts=document.getElementById('lfb-ts');if(!canRefresh()){if(ts)ts.textContent='ดูข้อมูลล่าสุดได้ แต่ไม่มีสิทธิ์อัปเดต';return Promise.resolve(false)}if(button){button.disabled=true;button.textContent='กำลังโหลด...'}return Promise.all([fetch(FB_URL).then(function(response){if(!response.ok)throw new Error('HTTP '+response.status);return response.text()}),cloudGet(FB_CLOUD)]).then(function(res){var stored=mergePages(load(FB_CACHE,[]),snapshotRows(res[1])).rows,merged=mergePages(stored,parsePages(res[0])),now=Date.now();save(FB_CACHE,merged.rows);stamp(FB_REFRESHED);renderPages(merged.rows);return cloudSet(FB_CLOUD,{items:merged.rows,updatedAt:now,updatedBy:window._rbUser?window._rbUser.name:''}).then(function(ok){if(ok===false){if(ts)ts.textContent='อัปเดตในเครื่องแล้ว · บันทึกส่วนกลางไม่สำเร็จ';return false}if(ts)ts.textContent='อัปเดตแล้ว · เพิ่ม '+merged.added+' · ปรับปรุง '+merged.updated+' · รวม '+merged.rows.length;setTimeout(function(){refreshStatus('lfb-ts',FB_REFRESHED)},3500);return true})}).catch(function(){var cached=load(FB_CACHE,[]);if(cached.length)renderPages(cached);if(ts)ts.textContent='เชื่อมต่อไม่ได้ · ใช้ข้อมูลล่าสุดที่บันทึกไว้';return false}).finally(function(){if(button){button.disabled=false;button.textContent='อัปเดตข้อมูลล่าสุด'}})}
function installOverrides(){window._initFbList=initFbListManual;window._lfbFetch=fetchFbPagesManual}

function setupCommission(){var panel=document.querySelector('[data-sub="commission"]');if(!panel||panel.getAttribute('data-rb-manual-refresh')==='1')return;panel.setAttribute('data-rb-manual-refresh','1');var old=panel.innerHTML;panel.innerHTML='<div class="rb-heavy-toolbar"><button type="button" data-rb-heavy-refresh id="rb-commission-refresh">อัปเดตข้อมูลล่าสุด</button><span id="rb-commission-ts"></span></div>'+old;var button=document.getElementById('rb-commission-refresh');if(button)button.addEventListener('click',function(){if(!canRefreshCommission())return;button.disabled=true;button.textContent='กำลังอัปเดต...';setTimeout(function(){if(typeof window.fbRefreshOrders==='function')window.fbRefreshOrders();stamp(COMM_REFRESHED);refreshStatus('rb-commission-ts',COMM_REFRESHED);button.disabled=false;button.textContent='อัปเดตข้อมูลล่าสุด'},0)})}

function boot(){installOverrides();setupCommission();applyPermissions()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
document.addEventListener('click',function(event){var nav=event.target.closest('.gsnav-btn,#sidebar button,#rb-bottom-nav button');if(!nav)return;installOverrides();setTimeout(function(){installOverrides();setupCommission();applyPermissions()},0)},true);
window.addEventListener('storage',function(event){if(event.key===FB_CACHE||event.key===FB_REFRESHED){var cached=load(FB_CACHE,[]);if(cached.length)renderPages(cached);refreshStatus('lfb-ts',FB_REFRESHED)}});
window._rbFbRefreshTest={parsePages:parsePages,pageKey:pageKey,mergePages:mergePages};
setInterval(function(){if(!document.hidden)applyPermissions()},60000);
})();
