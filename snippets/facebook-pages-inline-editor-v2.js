(function(){
'use strict';

var SHEET_URL='https://docs.google.com/spreadsheets/d/1lw9ZR4rBIuR8LJkTVPJc4qCthdOyS7IapYwFozy9ILc/gviz/tq?tqx=out:csv&gid=524471345';
var EDIT_KEY='rb_fbpages_edits_v2';
var CLOUD_PATH='/fbpages_edits_v2';
var edits=loadObject(EDIT_KEY);
var originalRender=null;
var lastRawData=[];
var liveRequest=null;
var cloudLoaded=false;
var activationBound=false;

function loadObject(key){try{var value=JSON.parse(localStorage.getItem(key)||'{}');return value&&typeof value==='object'?value:{};}catch(e){return {};}}
function saveObject(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch(e){return false;}}
function copy(row){var result={};Object.keys(row||{}).forEach(function(key){result[key]=row[key];});return result;}
function esc(value){return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function hash(value){var text=String(value||''),h=2166136261;for(var i=0;i<text.length;i++){h^=text.charCodeAt(i);h+=(h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24);}return(h>>>0).toString(36);}
function rowKey(row){if(row&&row._fbpKey)return row._fbpKey;if(row&&row.manual&&row.id)return'manual_'+hash(row.id);var identity=row&&(row.fbid||row._fbpSourceName||row.name)||'';return'sheet_'+hash(identity);}
function unique(values){var result=[];(values||[]).forEach(function(value){value=String(value||'').trim();if(value&&result.indexOf(value)===-1)result.push(value);});return result.sort(function(a,b){return a.localeCompare(b,'th');});}
function mergeMaps(local,cloud){var result={};[cloud||{},local||{}].forEach(function(source){Object.keys(source).forEach(function(key){var incoming=source[key]||{},current=result[key]||{};if(!result[key]||Number(incoming.updatedAt||0)>=Number(current.updatedAt||0))result[key]=incoming;});});return result;}

function parseCsvLine(line){var cols=[],current='',quoted=false;for(var i=0;i<line.length;i++){var ch=line[i];if(ch==='"'){if(quoted&&line[i+1]==='"'){current+='"';i++;}else quoted=!quoted;}else if(ch===','&&!quoted){cols.push(current.trim());current='';}else current+=ch;}cols.push(current.trim());return cols;}
function parseSheet(csv){var lines=String(csv||'').replace(/\r/g,'').split('\n').filter(function(line){return line.trim();});return lines.slice(1).map(function(line){var cols=parseCsvLine(line);return{type:'',emp:cols[3]||'',own:cols[3]||'',prod:cols[1]||'',st:cols[2]||'',name:cols[0]||'',fbid:cols[4]||'',limit:'',flag:false,upd:'',bal:''};}).filter(function(row){return row.name&&(row.prod||row.emp||row.st);});}

function applyEdits(rows){return(rows||[]).map(function(row){var result=copy(row),key=rowKey(row),entry=edits[key];result._fbpKey=key;result._fbpSourceName=row._fbpSourceName||row.name||'';if(entry){['name','prod','st','own'].forEach(function(field){if(Object.prototype.hasOwnProperty.call(entry,field))result[field]=entry[field];});result._fbpEditedAt=entry.updatedAt||0;}return result;});}
function canEdit(){var role=window._rbUser&&window._rbUser.role||'';return role==='sup'||role==='spec';}
function saveEdits(){saveObject(EDIT_KEY,edits);if(typeof window.fbSet==='function')window.fbSet(CLOUD_PATH,edits);}
function syncCloud(done){if(cloudLoaded||typeof window.fbGet!=='function'){cloudLoaded=true;if(done)done();return;}window.fbGet(CLOUD_PATH,function(error,data){if(!error&&data&&typeof data==='object'){edits=mergeMaps(edits,data);saveObject(EDIT_KEY,edits);}cloudLoaded=true;if(done)done();});}

function formatActualTime(date){return'ข้อมูลล่าสุด '+date.toLocaleDateString('th-TH',{day:'2-digit',month:'short',year:'2-digit'})+' · '+date.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'});}
function setRefreshState(loading,message){var button=document.getElementById('lfb-upd'),timestamp=document.getElementById('lfb-ts');if(button){button.disabled=!!loading;button.textContent=loading?'กำลังดึงข้อมูลจริง...':'อัปเดตข้อมูลล่าสุด';}if(timestamp&&message)timestamp.textContent=message;}

function refreshLiveData(){
  if(liveRequest)return liveRequest;
  setRefreshState(true,'กำลังตรวจสถานะจริงจากชีต...');
  liveRequest=fetch(SHEET_URL,{cache:'no-store'}).then(function(response){if(!response.ok)throw new Error('HTTP '+response.status);return response.text();}).then(function(csv){
    var rows=parseSheet(csv);
    if(!rows.length)throw new Error('ไม่พบข้อมูล Facebook Pages');
    window._lfbData=rows;
    try{localStorage.setItem('rb_fbpages_cache_v1',JSON.stringify(rows));localStorage.setItem('rb_fbpages_refreshed_v1',String(Date.now()));}catch(e){}
    var root=document.getElementById('fbl-root'),merged=window._fpMerge?window._fpMerge(rows):rows;
    if(root&&typeof window._renderFbList==='function')window._renderFbList(root,merged);
    setRefreshState(false,formatActualTime(new Date()));
    return rows;
  }).catch(function(error){
    var cached=[];try{cached=JSON.parse(localStorage.getItem('rb_fbpages_cache_v1')||'[]')||[];}catch(e){}
    var root=document.getElementById('fbl-root');if(root&&cached.length&&typeof window._renderFbList==='function')window._renderFbList(root,window._fpMerge?window._fpMerge(cached):cached);
    setRefreshState(false,cached.length?'ดึงข้อมูลจริงไม่สำเร็จ · แสดงข้อมูลที่บันทึกล่าสุด':'ดึงข้อมูลจริงไม่สำเร็จ');
    throw error;
  }).finally(function(){liveRequest=null;});
  return liveRequest;
}

function buildSelect(values,current,label){var list=unique([current].concat(values||[]));return'<select class="rb-fbp-edit-field" aria-label="'+esc(label)+'">'+list.map(function(value){return'<option value="'+esc(value)+'"'+(value===current?' selected':'')+'>'+esc(value)+'</option>';}).join('')+'</select>';}
function notificationValue(name){var data=loadObject('rb_fb_notif');return data[name]||'';}
function notificationMarkup(name){var value=notificationValue(name),label=value==='1'?'แจ้งรอบแรก (แชร์เพจ)':value==='2'?'แจ้งรอบ 2 (ยิงแอด)':'ยังไม่ได้แจ้ง',tone=value==='1'?' is-first':value==='2'?' is-second':' is-none';return'<span class="rb-fbp-notification'+tone+'" title="ข้อมูลจากระบบ ดูได้อย่างเดียว"><span aria-hidden="true">🔒</span>'+esc(label)+'</span>';}

function recordForRow(row){var name=row.getAttribute('data-name')||'',rows=window._fblSummaryData||[];for(var i=0;i<rows.length;i++){if(rows[i].name===name)return rows[i];}return null;}
function clearEditable(cell){if(!cell)return;cell.contentEditable='false';cell.removeAttribute('contenteditable');cell.removeAttribute('title');cell.style.cursor='';}
function makeButton(className,label){var button=document.createElement('button');button.type='button';button.className=className;button.textContent=label;return button;}

function makeFilterField(label,sourceSelector,attribute){
  var field=document.createElement('label');field.className='rb-fbp-filter-field';
  var caption=document.createElement('span');caption.className='rb-fbp-filter-label';caption.textContent=label;
  var select=document.createElement('select');select.className='rb-fbp-filter-select';select.setAttribute('aria-label',label);
  [].forEach.call(document.querySelectorAll(sourceSelector),function(button){
    var option=document.createElement('option'),value=button.getAttribute('data-'+attribute)||'';
    option.value=value;option.textContent=button.textContent.trim();select.appendChild(option);
  });
  select.addEventListener('change',function(){var target=document.querySelector(sourceSelector+'[data-'+attribute+'="'+String(select.value).replace(/"/g,'\\"')+'"]');if(target)target.click();});
  field.appendChild(caption);field.appendChild(select);return field;
}

function professionalizeRoot(root){
  if(!root)return;
  root.classList.add('rb-fbp-professional');
  var summary=root.firstElementChild,search=root.querySelector('#fbl-q');
  if(summary)summary.classList.add('rb-fbp-overview');
  var grids=summary?summary.querySelectorAll('.rb-fbp-summary-grid'):[];
  if(grids[0])grids[0].classList.add('rb-fbp-kpi-grid');
  if(grids[1])grids[1].remove();
  var statusSource=search?search.nextElementSibling:null,ownerSource=statusSource?statusSource.nextElementSibling:null;
  var productSource=summary?summary.nextElementSibling:null;
  if(statusSource)statusSource.classList.add('rb-fbp-filter-source');
  if(ownerSource)ownerSource.classList.add('rb-fbp-filter-source');
  if(productSource)productSource.classList.add('rb-fbp-filter-source');
  var filter=document.createElement('section');filter.className='rb-fbp-filter-panel';filter.setAttribute('aria-label','ค้นหาและตัวกรอง Facebook Pages');
  var searchField=document.createElement('label');searchField.className='rb-fbp-filter-field rb-fbp-search-field';
  var searchLabel=document.createElement('span');searchLabel.className='rb-fbp-filter-label';searchLabel.textContent='ค้นหาเพจ';searchField.appendChild(searchLabel);
  if(search){search.placeholder='ชื่อเพจ หรือ Facebook ID';searchField.appendChild(search);}
  filter.appendChild(searchField);
  filter.appendChild(makeFilterField('สถานะเพจ','.fblsb','s'));
  filter.appendChild(makeFilterField('พนักงาน','.fblob','o'));
  filter.appendChild(makeFilterField('สินค้า','.fblpb','p'));
  var reset=makeButton('rb-fbp-filter-reset','ล้างตัวกรอง');reset.addEventListener('click',function(){
    if(search){search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));}
    ['.fblsb[data-s="ALL"]','.fblob[data-o="ALL"]','.fblpb[data-p="ALL"]'].forEach(function(selector){var button=root.querySelector(selector);if(button)button.click();});
    [].forEach.call(filter.querySelectorAll('select'),function(select){select.selectedIndex=0;});
  });filter.appendChild(reset);
  var tableShell=root.querySelector('table');tableShell=tableShell&&tableShell.parentElement;
  if(tableShell){tableShell.classList.add('rb-fbp-table-shell');root.insertBefore(filter,tableShell);}
  var table=root.querySelector('table');
  if(table){
    table.classList.add('rb-fbp-table');
    var oldGroup=table.querySelector('colgroup');if(oldGroup)oldGroup.remove();
    var group=document.createElement('colgroup');[36,13,14,12,17,8].forEach(function(width){var col=document.createElement('col');col.style.width=width+'%';group.appendChild(col);});
    table.insertBefore(group,table.firstChild);
    var heads=table.querySelectorAll('thead th');if(heads[3])heads[3].textContent='พนักงาน';if(heads[5])heads[5].textContent='จัดการ';
  }
}

function decorateRow(row,record){
  if(!row||!record)return;
  var cells=row.querySelectorAll('td');if(cells.length<6)return;
  row.setAttribute('data-fbp-key',rowKey(record));
  row.classList.remove('rb-fbp-row-editing');
  [0,1,2,3].forEach(function(index){clearEditable(cells[index]);});
  cells[0].innerHTML='<span class="rb-fbp-cell-main">'+esc(record.name)+'</span>'+(record.manual?'<span class="rb-fbp-manual">เพิ่มเอง</span>':'')+(record.fbid?'<span class="rb-fbp-cell-meta">Facebook ID '+esc(record.fbid)+'</span>':'');
  cells[1].textContent=record.prod||'—';
  var statusClass=record.st==='ใช้งาน'?' is-active':record.st==='ว่าง'?' is-idle':' is-closed';
  cells[2].innerHTML='<span class="rb-fbp-page-status'+statusClass+'">'+esc(record.st||'—')+'</span>';
  cells[3].innerHTML='<span class="rb-fbp-employee">'+esc(record.own||'—')+'</span>';
  cells[4].innerHTML=notificationMarkup(record.name);
  var deleteButton=cells[5].querySelector('[data-fpid]')||row._fbpDeleteButton||null;if(deleteButton)row._fbpDeleteButton=deleteButton;
  cells[5].innerHTML='';cells[5].classList.add('rb-fbp-actions-cell');
  if(canEdit()){var editButton=makeButton('rb-fbp-row-edit','✎ แก้ไข');editButton.addEventListener('click',function(){beginEdit(row,record);});cells[5].appendChild(editButton);}
  if(deleteButton)cells[5].appendChild(deleteButton);
}

function beginEdit(row,record){
  if(!canEdit()||row.classList.contains('rb-fbp-row-editing'))return;
  var cells=row.querySelectorAll('td');if(cells.length<6)return;
  row.classList.add('rb-fbp-row-editing');
  cells[0].innerHTML='<input class="rb-fbp-edit-field" aria-label="ชื่อเพจ" value="'+esc(record.name)+'">';
  cells[1].innerHTML=buildSelect(window._fpProdsCache||[],record.prod,'สินค้า');
  cells[2].innerHTML=buildSelect(window._fpStatusCache||[],record.st,'สถานะ');
  cells[3].innerHTML=buildSelect(window._fpOwnersCache||[],record.own,'เจ้าของ');
  cells[4].innerHTML=notificationMarkup(record.name);
  cells[5].innerHTML='';
  var cancel=makeButton('rb-fbp-row-cancel','ยกเลิก'),save=makeButton('rb-fbp-row-save','✓ บันทึก');
  cancel.addEventListener('click',function(){decorateRow(row,record);});
  save.addEventListener('click',function(){
    var name=String(cells[0].querySelector('input').value||'').trim(),selects=row.querySelectorAll('select.rb-fbp-edit-field');
    if(!name){cells[0].querySelector('input').focus();row.classList.add('rb-fbp-row-error');return;}
    row.classList.remove('rb-fbp-row-error');
    var key=row.getAttribute('data-fbp-key')||rowKey(record);
    edits[key]={name:name,prod:selects[0]?selects[0].value:record.prod,st:selects[1]?selects[1].value:record.st,own:selects[2]?selects[2].value:record.own,sourceName:record._fbpSourceName||record.name,fbid:record.fbid||'',updatedAt:Date.now(),updatedBy:window._rbUser&&window._rbUser.name||''};
    saveEdits();
    var root=document.getElementById('fbl-root');if(root&&typeof window._renderFbList==='function')window._renderFbList(root,lastRawData);
  });
  cells[5].appendChild(cancel);cells[5].appendChild(save);
}

function enhanceRows(root){
  if(!root)return;
  root.querySelectorAll('#fbl-body tr[data-name]').forEach(function(row){var record=recordForRow(row);if(record)decorateRow(row,record);});
  var body=root.querySelector('#fbl-body');if(body&&!body._fbpObserver){body._fbpObserver=new MutationObserver(function(){enhanceRows(root);});body._fbpObserver.observe(body,{childList:true});}
}

function decorateHeader(){
  var panel=document.querySelector('[data-sub="fblist"]'),button=document.getElementById('lfb-upd');if(!panel||!button)return;
  var tools=button.parentElement;if(!tools)return;
  var unified=panel.querySelector('.rb-unified-section-banner'),bar=unified||panel.querySelector('.rb-fbp-titlebar');
  if(unified){
    unified.classList.add('rb-fbp-titlebar');
    var subtitle=unified.querySelector('.rb-unified-section-subtitle');if(subtitle)subtitle.textContent='ดูสถานะจริงจากชีตและแก้ไขข้อมูลในตาราง';
    var duplicate=panel.querySelector('.rb-fbp-titlebar:not(.rb-unified-section-banner)');if(duplicate&&duplicate!==unified)duplicate.remove();
  }
  if(!bar){
    bar=document.createElement('div');bar.className='rb-fbp-titlebar';
    bar.innerHTML='<div class="rb-fbp-title"><span class="rb-fbp-title-icon">ⓕ</span><span><strong>จัดการ Facebook Pages</strong><small>ดูสถานะจริงจากชีตและแก้ไขข้อมูลในตาราง</small></span></div>';
    panel.insertBefore(bar,panel.firstChild);bar.appendChild(tools);
  }
  if(tools.parentElement!==bar)bar.appendChild(tools);
  tools.className='rb-fbp-tools';tools.removeAttribute('style');
  var timestamp=document.getElementById('lfb-ts');if(timestamp&&tools.firstChild!==timestamp)tools.insertBefore(timestamp,tools.firstChild);
  if(timestamp&&!timestamp.textContent){var saved=Number(localStorage.getItem('rb_fbpages_refreshed_v1')||0);timestamp.textContent=saved?formatActualTime(new Date(saved)):'ยังไม่ได้ดึงข้อมูลจริง';}
  var add=document.getElementById('fp-add-btn');if(add)add.style.display=canEdit()?'':'none';
}

function installRenderer(){
  if(originalRender||typeof window._renderFbList!=='function')return;
  originalRender=window._renderFbList;
  var wrapped=function(root,data){
    lastRawData=(data||[]).map(copy);
    var effective=applyEdits(lastRawData);
    window._fpProdsCache=unique(effective.map(function(row){return row.prod;}));
    window._fpOwnersCache=unique(effective.map(function(row){return row.own;}));
    window._fpStatusCache=unique(effective.map(function(row){return row.st;}));
    originalRender(root,effective);
    professionalizeRoot(root);
    setTimeout(function(){decorateHeader();enhanceRows(root);},0);
  };
  wrapped._fbpInlineEditorV2=true;
  window._renderFbList=wrapped;
}

function activate(){installRenderer();decorateHeader();syncCloud(function(){var current=window._fblSummaryData||[];var root=document.getElementById('fbl-root');if(root&&current.length&&typeof window._renderFbList==='function')window._renderFbList(root,current);refreshLiveData().catch(function(){});});}
function bindActivation(){if(activationBound)return;activationBound=true;document.addEventListener('click',function(event){var button=event.target&&event.target.closest?event.target.closest('.gsnav-btn'):null;if(!button||button.textContent.indexOf('Facebook Pages')===-1)return;setTimeout(activate,30);});}
function install(){installRenderer();window._lfbFetch=refreshLiveData;bindActivation();decorateHeader();var panel=document.querySelector('[data-sub="fblist"].gsp-active');if(panel&&!panel.getAttribute('data-fbp-live-started')){panel.setAttribute('data-fbp-live-started','1');activate();}}

window._fbpInlineEditorTest={parseCsvLine:parseCsvLine,parseSheet:parseSheet,rowKey:rowKey,applyEdits:applyEdits,mergeMaps:mergeMaps,unique:unique,notificationMarkup:notificationMarkup};
install();
setTimeout(install,300);
setTimeout(install,900);
})();
