(function (w) {
  'use strict';
  var DB='https://richbiotech-c4e41-default-rtdb.firebaseio.com/', cache={}, identity='', pending=null, loaded=false;
  var catalog={}, catalogLoaded=false, catalogPending=null, revision=0, retryAt=0, catalogRetryAt=0;
  function user(){return w._rbUser||{};}
  function all(u){return u.role==='sup'||u.role==='audit';}
  function key(value){return 'k_'+btoa(unescape(encodeURIComponent(String(value)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function session(){var u=user(), sig=(u.uid||'')+':'+(u.role||'');if(sig!==identity){identity=sig;cache={};loaded=false;pending=null;document.querySelectorAll('.cts-overlay').forEach(function(x){x.remove();});}return sig;}
  function render(){revision++;if(w.ctRender)w.ctRender();}
  async function request(path,options){
    if(!user().uid||!w.rbFirebaseAuth)throw new Error('กรุณาเข้าสู่ระบบใหม่');
    var controller=new AbortController(), timer=setTimeout(function(){controller.abort();},20000);
    try {var r=await w.rbFirebaseAuth.fetch(DB+path+'.json',Object.assign({cache:'no-store',signal:controller.signal},options||{}));
      if(!r.ok)throw new Error(r.status===412?'ข้อมูลถูกแก้ไขจากอีกหน้าต่าง กรุณาเปิดรายการใหม่ก่อนบันทึก':r.status===401||r.status===403?'บัญชีนี้ไม่มีสิทธิ์ดำเนินการ':'เชื่อมต่อไม่สำเร็จ กรุณาลองอีกครั้ง');
      return {value:await r.json(),etag:r.headers.get('ETag')};
    }finally{clearTimeout(timer);}
  }
  async function load(force){
    var sig=session(),u=user();if(!u.uid)return;
    if(pending)return pending;if((loaded||Date.now()<retryAt)&&!force)return;
    pending=request('content_submissions_v1'+(all(u)?'':'/'+u.uid)).then(function(r){
      if(session()!==sig)return;cache=all(u)?(r.value||{}):Object.fromEntries([[u.uid,r.value||{}]]);loaded=true;render();
    }).catch(function(e){if(identity===sig)retryAt=Date.now()+15000;throw e;}).finally(function(){if(identity===sig)pending=null;});return pending;
  }
  function entries(id){session();var k=key(id),u=user();return Object.keys(cache).filter(function(uid){return all(u)||uid===u.uid;}).map(function(uid){return cache[uid][k];}).filter(Boolean);}
  function date(n){return new Date(n).toLocaleString('th-TH',{timeZone:'Asia/Bangkok',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});}
  function cell(id){var rows=entries(id);return '<div class="cts-cell">'+rows.map(function(r){return '<button type="button" class="cts-text-card" data-content-id="'+esc(id)+'" title="'+esc(r.text)+'"><span class="cts-text-author">▤ '+esc(r.ownerName)+'</span><span class="cts-text-preview">'+esc(r.text)+'</span><span class="cts-text-edit">'+(r.ownerUid===user().uid?'แก้ไข':'ดูรายละเอียด')+' ↗</span></button>';}).join('')+(rows.some(function(r){return r.ownerUid===user().uid;})?'':'<button type="button" class="cts-open" data-content-id="'+esc(id)+'">＋ เพิ่มข้อความ</button>')+'</div>';}
  function dates(id,name){var rows=entries(id).filter(function(r){return !name||r.ownerName.toUpperCase()===name.toUpperCase();});return rows.length?rows.map(function(r){return '<span class="cts-date">'+(!name?esc(r.ownerName)+'<br>':'')+esc(date(r.updatedAt))+'</span>';}).join(''):'<span class="cts-muted">—</span>';}
  function overlay(title){var bg=document.createElement('div');bg.className='cts-overlay';bg.innerHTML='<section class="cts-dialog" role="dialog" aria-modal="true" aria-label="'+esc(title)+'"><header><h2>'+esc(title)+'</h2><button type="button" class="cts-close" aria-label="ปิด">×</button></header><div class="cts-body"></div></section>';document.body.appendChild(bg);bg.querySelector('.cts-close').onclick=function(){if(bg.dataset.busy)return;if(bg.dataset.dirty&&!confirm('ปิดโดยไม่บันทึกข้อความที่แก้ไขหรือไม่?'))return;bg.remove();};return bg;}
  async function open(id,ownerUid){
    session();var u=user(),sig=identity;if(!u.uid)return;
    var existing=document.querySelector('.cts-inline');if(existing){if(existing.dataset.busy)return;if(existing.dataset.dirty&&!confirm('เปลี่ยนรายการโดยไม่บันทึกข้อความที่แก้ไขหรือไม่?'))return;existing.remove();}
    var bg=overlay('List Content'),body=bg.querySelector('.cts-body');bg.classList.add('cts-inline');bg.querySelector('section').setAttribute('role','region');bg.querySelector('section').removeAttribute('aria-modal');
    var host=document.querySelector('.ct-wrap');if(host){host.appendChild(bg);var hint=host.querySelector('.cts-editor-hint');if(hint)hint.hidden=true;}
    if(bg.scrollIntoView)bg.scrollIntoView({block:'nearest',behavior:'smooth'});body.textContent='กำลังโหลดข้อความล่าสุด…';
    try{
      await load(true);if(session()!==sig||!bg.isConnected)return;
      if(ownerUid&&ownerUid!==u.uid){
        var selected=entries(id).find(function(r){return r.ownerUid===ownerUid;});
        body.innerHTML='';var title=document.createElement('p');title.className='cts-context';var context=w.ctContentRows&&w.ctContentRows().find(function(r){return String(r.id)===String(id);});title.textContent=context?(context.brand+' · '+context.episode+' · HOOK: '+(context.ready||'')):String(id);body.appendChild(title);
        if(selected){var heading=document.createElement('strong');heading.textContent=selected.ownerName+' · อัปเดต '+date(selected.updatedAt);var text=document.createElement('pre');text.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;line-height:1.7';text.textContent=selected.text;body.append(heading,text);}else body.appendChild(document.createTextNode('ไม่พบข้อความที่คุณมีสิทธิ์ดู'));
        return;
      }
      var own=await request('content_submissions_v1/'+u.uid+'/'+key(id),{headers:{'X-Firebase-ETag':'true'}});
      if(session()!==sig||!bg.isConnected)return;
      var row=w.ctContentRows&&w.ctContentRows().find(function(r){return String(r.id)===String(id);});
      body.innerHTML='<p class="cts-context">'+esc(row?(row.brand||'')+' · '+(row.episode||row.script||id):id)+'</p><p class="cts-muted">'+(all(u)?'คุณเห็นข้อความของทุกคน':'คุณเห็นเฉพาะข้อความของคุณ • Supervisor และ Audit ตรวจดูได้')+'</p><div class="cts-others"></div><label for="cts-text">ข้อความของ '+esc(u.name)+'</label><textarea id="cts-text" maxlength="10000" rows="8" placeholder="พิมพ์หรือวาง List Content ที่นี่ หนึ่งรายการต่อบรรทัด"></textarea><p class="cts-status" role="status"></p><footer><button class="cts-save" type="button">✓ บันทึกข้อความ</button></footer>';
      var others=body.querySelector('.cts-others');entries(id).filter(function(r){return r.ownerUid!==u.uid;}).forEach(function(r){var card=document.createElement('article');var h=document.createElement('strong');h.textContent=r.ownerName+' · '+date(r.updatedAt);var p=document.createElement('pre');p.textContent=r.text;card.append(h,p);others.appendChild(card);});
      var textarea=body.querySelector('textarea'),status=body.querySelector('.cts-status'),button=body.querySelector('.cts-save');textarea.value=own.value?own.value.text:'';textarea.oninput=function(){bg.dataset.dirty='1';};
      button.onclick=async function(){
        var text=textarea.value.trim();if(!text){status.textContent='กรุณากรอกข้อความก่อนบันทึก';return;}
        if(session()!==sig)return;button.disabled=true;bg.dataset.busy='1';status.textContent='กำลังบันทึก…';
        var record={rowId:String(id),ownerUid:u.uid,ownerName:u.name,text:text,updatedAt:{'.sv':'timestamp'}};
        try{var saved=await request('content_submissions_v1/'+u.uid+'/'+key(id),{method:'PUT',headers:{'Content-Type':'application/json','if-match':own.etag},body:JSON.stringify(record)});
          if(session()!==sig)return;(cache[u.uid]||(cache[u.uid]={}))[key(id)]=saved.value;
          // A subsequent save needs a fresh ETag; close only after the server confirms.
          bg.dataset.dirty='';render();bg.remove();var hint=document.querySelector('.cts-editor-hint');if(hint){hint.hidden=false;hint.textContent='✓ บันทึกข้อความแล้ว • ชื่อผู้ส่งและเวลาปรับอัตโนมัติ เลือกรายการถัดไปได้เลย';}
        }catch(e){status.textContent=e.name==='AbortError'?'ยังยืนยันการบันทึกไม่ได้ ข้อความยังอยู่ กรุณาเปิดตรวจสอบรายการอีกครั้งก่อนส่งซ้ำ':e.message;}
        finally{button.disabled=false;delete bg.dataset.busy;}
      };textarea.focus();
    }catch(e){body.textContent='โหลดไม่สำเร็จ: '+e.message;}
  }
  async function loadCatalog(){
    if(catalogLoaded||!user().uid||Date.now()<catalogRetryAt)return;if(catalogPending)return catalogPending;
    catalogPending=request('content_product_catalog_v1').then(function(r){catalog=r.value||{};catalogLoaded=true;if(w.ctApplyCatalog)w.ctApplyCatalog(Object.values(catalog));}).catch(function(e){catalogRetryAt=Date.now()+15000;throw e;}).finally(function(){catalogPending=null;});return catalogPending;
  }
  async function manage(){
    if(user().role!=='sup')return;var sig=session(),bg=overlay('จัดการสินค้าและผู้ดูแล'),body=bg.querySelector('.cts-body');body.textContent='กำลังโหลด…';
    try{catalogLoaded=false;await loadCatalog();if(session()!==sig||!bg.isConnected)return;
      var products=w.ctProductList(),assignments=w.ctProductOwners();
      body.innerHTML='<label>เลือกสินค้าเพื่อปรับผู้ดูแล หรือเพิ่มสินค้าใหม่</label><select class="cts-product"><option value="">+ เพิ่มสินค้าใหม่</option></select><label>ชื่อสินค้า</label><input class="cts-name" maxlength="80"><label>ชื่อพนักงานผู้ดูแล (คั่นด้วยเครื่องหมายจุลภาค)</label><input class="cts-owners" maxlength="400" placeholder="เช่น NUNE, JAM"><p class="cts-muted">ใส่ชื่อให้ตรงกับบัญชีพนักงาน เพิ่มผู้ดูแลได้หลายคน บัญชีใหม่สร้างได้จากเมนู USER</p><p class="cts-status" role="status"></p><footer><button class="cts-save">✓ บันทึกสินค้าและผู้ดูแล</button></footer>';
      var select=body.querySelector('select'),name=body.querySelector('.cts-name'),owners=body.querySelector('.cts-owners'),status=body.querySelector('.cts-status'),button=body.querySelector('.cts-save');
      products.forEach(function(p){var o=document.createElement('option');o.value=p;o.textContent=p;select.appendChild(o);});
      var selected='';select.onchange=function(){selected=select.value;name.value=selected;name.disabled=!!selected;owners.value=(assignments[selected]||'').split(' ').filter(Boolean).join(', ');status.textContent='';};
      button.onclick=async function(){
        var n=name.value.trim(),names=Array.from(new Set(owners.value.split(/[,\n]+/).map(function(s){return s.trim().toUpperCase();}).filter(Boolean)));
        if(!n||/[\u0000-\u001f]/.test(n)||names.some(function(s){return !/^[A-Z0-9ก-๙_-]{1,64}$/.test(s);})||names.length>20){status.textContent='กรอกชื่อสินค้า และชื่อผู้ดูแลไม่เกิน 20 คน (ไม่มีช่องว่างในชื่อ)';return;}
        if(!selected&&products.some(function(p){return p.toLowerCase()===n.toLowerCase();})){status.textContent='มีสินค้านี้แล้ว กรุณาเลือกจากรายการด้านบน';return;}
        if(session()!==sig||user().role!=='sup')return;button.disabled=true;bg.dataset.busy='1';
        try{var current=await request('content_product_catalog_v1/'+key(n),{headers:{'X-Firebase-ETag':'true'}});
          var baseline=catalog[key(n)]||null;if(JSON.stringify(current.value)!==JSON.stringify(baseline))throw new Error('สินค้าเปลี่ยนจากอีกหน้าต่าง กรุณาปิดแล้วเปิดใหม่');
          var r=await request('content_product_catalog_v1/'+key(n),{method:'PUT',headers:{'Content-Type':'application/json','if-match':current.etag},body:JSON.stringify({name:n,owners:names.join(' '),updatedAt:{'.sv':'timestamp'}})});
          if(session()!==sig)return;catalog[key(n)]=r.value;w.ctApplyCatalog(Object.values(catalog));bg.remove();
        }catch(e){status.textContent=e.message;}finally{button.disabled=false;delete bg.dataset.busy;}
      };
    }catch(e){body.textContent='โหลดสินค้าไม่สำเร็จ: '+e.message;}
  }
  function mount(){session();var actions=document.querySelector('.ct-actions');if(!actions||!user().uid)return;
    var host=document.querySelector('.ct-wrap');if(host&&!host.querySelector('.cts-scope-banner')){var scope=document.createElement('div');scope.className='cts-scope-banner';scope.setAttribute('role','note');var table=host.querySelector('.ct-table-container');if(table)table.insertAdjacentElement('beforebegin',scope);var hint=document.createElement('div');hint.className='cts-editor-hint';hint.textContent='▤ เลือก “เพิ่มข้อความ” หรือข้อความในแถว เพื่อกรอก List Content ด้านล่างตาราง';host.appendChild(hint);}
    var scope=host&&host.querySelector('.cts-scope-banner'),scopeText=all(user())?'◉ มุมมอง Supervisor / Audit • เห็น List Content ของทุกคน':'◉ มุมมอง '+user().name+' • เห็นเฉพาะ List Content ของคุณ';if(scope&&scope.textContent!==scopeText)scope.textContent=scopeText;
    var btn=document.getElementById('cts-manage');if(!btn){btn=document.createElement('button');btn.id='cts-manage';btn.className='ct-btn ct-btn-secondary';btn.textContent='⚙ จัดการสินค้าและผู้ดูแล';btn.onclick=manage;actions.appendChild(btn);}btn.hidden=user().role!=='sup';
    var refresh=document.getElementById('cts-refresh');if(!refresh){refresh=document.createElement('button');refresh.id='cts-refresh';refresh.className='ct-btn ct-btn-secondary';refresh.textContent='↻ อัปเดตข้อความ';actions.appendChild(refresh);refresh.onclick=function(){refresh.disabled=true;Promise.all([load(true),loadCatalog()]).catch(function(e){alert(e.message);}).finally(function(){refresh.disabled=false;});};}
    load().catch(function(){refresh.textContent='↻ โหลดข้อความไม่สำเร็จ · ลองใหม่';});loadCatalog().catch(function(){catalogLoaded=false;});
  }
  document.addEventListener('click',function(e){var b=e.target.closest('[data-content-id]');if(b)open(b.dataset.contentId,b.dataset.contentOwner);});
  w.addEventListener('rb:auth-ready',function(){session();catalogLoaded=false;mount();render();});
  w.addEventListener('rb:auth-cleared',function(){session();render();});
  w.ctSubmissions={cell:cell,dates:dates,mount:mount,entries:entries,key:key,version:function(){session();return identity+':'+revision;}};
})(window);
