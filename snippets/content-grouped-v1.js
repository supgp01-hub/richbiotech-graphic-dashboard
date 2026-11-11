(function(w){
'use strict';
var expanded=new Set();
function manage(){return !!(w._rbUser&&w._rbUser.uid&&['sup','spec','audit'].includes(w._rbUser.role));}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function code(v){return w.rbOrderAssigneeCode?w.rbOrderAssigneeCode(v):String(v||'').trim().toUpperCase();}
function icon(kind){var paths={people:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M20 21v-2a4 4 0 0 0-3-3.87',file:'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h6',check:'M20 6 9 17l-5-5',clock:'M12 8v4l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',chevron:'m6 9 6 6 6-6',edit:'m16 3 5 5-13 13H3v-5z',trash:'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7'};return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+ '<path d="'+paths[kind]+'"/></svg>';}
function date(v){if(!v)return '—';var d=new Date(v);return isNaN(d)?'—':d.toLocaleDateString('th-TH',{timeZone:'Asia/Bangkok',day:'2-digit',month:'2-digit',year:'numeric'});}
function people(r){var u=w._rbUser||{},all=u.role==='sup'||u.role==='audit',entries=w.ctSubmissions?w.ctSubmissions.entries(r.id):[],orders=w.ctHookHistory?w.ctHookHistory.matches(r,w.lpORD?w.lpORD():[],w.ctContentRows?w.ctContentRows():[]):[],names=[];
function add(n){n=code(n);if(n&&!names.includes(n))names.push(n);}
if(all){var owners=(w.ctProductOwners?w.ctProductOwners():{})[r.brand]||'';String(owners).split(/[\s,]+/).forEach(add);orders.forEach(o=>add(o.assignee));entries.forEach(e=>add(e.ownerName));}else add(u.name);
return names.map(n=>({name:n,order:orders.find(o=>code(o.assignee)===n),entry:entries.find(e=>code(e.ownerName)===n),own:code(u.name)===n}));}
function employeeColumns(){if(!w.ctHookHistory||!w.ctHookHistory.allowed())return [];var brand=w.ctSelectedBrand?w.ctSelectedBrand():'ALL';if(brand==='ALL')return [''];var names=String((w.ctProductOwners?w.ctProductOwners():{})[brand]||'').split(/[\s,]+/).filter(Boolean).map(code);return names.length?Array.from(new Set(names)):[''];}
function columns(){return 8+(manage()?1:0)+employeeColumns().length;}
function employeeStyle(n){var palette={TER:['#d96400','#fff2df','#9c4700'],NUNE:['#FF64AD','#ffe4f0','#a92061'],JAM:['#5f6738','#edf0e2','#50592d'],MOS:['#191970','#eeeeFA','#191970'],BALL:['#00257d','#e8eefc','#00257d'],DOM:['#000000','#eeeeee','#333333'],VIEW:['#fbbc04','#fff6d8','#795800'],NUI:['#ea4335','#ffebe8','#a72c22'],MIND:['#c42b2b','#fceaea','#a02222']},c=palette[code(n)]||['#587368','#edf4f0','#36564a'];return '--ctg-person:'+c[0]+';--ctg-person-bg:'+c[1]+';--ctg-person-text:'+c[2];}
function deadlineBadge(n,v,withName){var d=date(v),label=(withName?esc(n)+' · ':'')+d;return '<span class="'+(d==='—'?'ctg-date-empty':'ctg-date-badge')+'"'+(d==='—'?'':' style="'+employeeStyle(n)+'"')+'>'+label+'</span>';}
function deadlineCells(list,r){return employeeColumns().map(function(n){if(n){var person=list.find(p=>p.name===n);return '<td class="ctg-employee-date">'+deadlineBadge(n,(r.manualDeadlines&&r.manualDeadlines[n]&&r.manualDeadlines[n].date)||(person&&person.order&&person.order.deadline),false)+'<button class="ctg-date-edit" data-date-row="'+esc(r.id)+'" data-date-employee="'+esc(n)+'" aria-label="แก้ไขวันที่ '+esc(n)+'">'+icon('edit')+'</button>'+'</td>';}return '<td class="ctg-employee-date"><div class="ctg-deadline-chips">'+list.map(p=>deadlineBadge(p.name,p.order&&p.order.deadline,true)).join('')+'</div></td>';}).join('');}
function row(r,num){var id=esc(r.id),list=people(r),sent=list.filter(p=>p.entry&&p.entry.text).length,open=expanded.has(String(r.id)),view=w.ctHookHistory&&w.ctHookHistory.allowed();
function link(url,label){return /^https?:\/\//i.test(url||'')?'<a href="'+esc(url)+'" target="_blank" rel="noopener">'+icon('file')+label+'</a>':'<span class="ctg-muted">'+label+' —</span>';}
var html='<tr class="ctg-main'+(open?' is-open':'')+'"><td><input type="checkbox" class="ct-row-chk ct-row-sel" data-id="'+id+'" onchange="ctChkChange()"></td><td>'+num+'</td><td><span class="ctg-brand">'+esc(r.brand||'—')+'</span></td><td class="ctg-script"><div class="ctg-links">'+link(r.script,'เปิดสคริปต์')+'</div></td><td class="ctg-clip"><div class="ctg-links">'+link(r.clipLink,'เปิดคลิป')+'</div></td><td class="ctg-title"><strong>'+esc(r.episode||r.name||'—')+'</strong></td><td class="ctg-hook">'+esc(r.ready||r.hook||'—')+'</td>'+deadlineCells(list,r)+'<td><button class="ctg-toggle '+(sent?'has-content':'')+'" data-ctg-toggle="'+id+'" aria-expanded="'+open+'">'+icon(sent?'people':'clock')+(sent?'ส่งแล้ว ':'ยังไม่ส่ง ')+sent+'/'+list.length+' คน'+icon('chevron')+'</button></td>'+(manage()?'<td><div class="ctg-actions"><button data-ctg-edit="'+id+'" aria-label="แก้ไขคอนเทนต์">'+icon('edit')+'</button><button data-ctg-delete="'+id+'" aria-label="ลบคอนเทนต์">'+icon('trash')+'</button></div></td>':'')+'</tr>';
if(!open)return html;
return html+'<tr class="ctg-detail"><td colspan="'+columns()+'"><section><table class="ctg-employees ctg-compact"><caption class="ctg-sr-only">List Content แยกพนักงาน</caption><thead><tr><th>พนักงาน</th><th>สถานะ</th><th>List Content</th><th>อัปเดต</th></tr></thead><tbody>'+list.map(function(p){var uid=p.entry?p.entry.ownerUid:(p.own?(w._rbUser||{}).uid:'');return '<tr><td><b>'+esc(p.name)+'</b></td><td><span class="'+(p.entry?'ctg-sent':'ctg-wait')+'">'+(p.entry?'ส่งแล้ว':'ยังไม่ส่ง')+'</span></td><td data-cts-row="'+id+'" data-cts-owner="'+esc(uid)+'"><div class="ctg-content-line">'+(w.ctSubmissions?w.ctSubmissions.history(p.entry):'<span class="ctg-muted">—</span>')+(p.own?'<button type="button" class="cts-edit-icon" data-content-id="'+id+'" data-content-owner="'+esc(uid)+'" aria-label="'+(p.entry?'แก้ข้อความของ ':'เพิ่มข้อความของ ')+esc(p.name)+'" title="'+(p.entry?'แก้ข้อความ':'เพิ่มข้อความ')+'">'+icon('edit')+'</button>':'')+'</div></td><td class="ctg-updated-cell">'+(w.ctSubmissions?w.ctSubmissions.updated(p.entry):'—')+'</td></tr>';}).join('')+'</tbody></table>'+(list.length?'':'<p class="ctg-muted">ยังไม่มีผู้ดูแลสินค้า</p>')+'</section></td></tr>';}

function mount(){if(w.ctPermissions)w.ctPermissions.mount();var head=document.querySelector('.ct-table>thead>tr');if(!head)return;var h='<th><input type="checkbox" id="ct-chk-all" class="ct-row-chk" onclick="ctToggleAll(this)"></th><th>#</th><th>สินค้า</th><th>สคริปต์</th><th>ลิงก์คลิป</th><th>ชื่อตอน</th><th>HOOK</th>'+employeeColumns().map(n=>'<th class="ctg-employee-heading">'+(n?'<span class="ctg-person-label"><i class="ctg-person-dot" aria-hidden="true" style="'+employeeStyle(n)+'"></i>'+esc(n)+'</span><small>Deadline</small>':'ผู้รับผิดชอบ / Deadline')+'</th>').join('')+'<th>List Content</th>'+(manage()?'<th>จัดการ</th>':'');if(head.innerHTML!==h)head.innerHTML=h;document.querySelector('.ct-table').classList.add('ctg-table');}
document.addEventListener('click',function(e){var b=e.target.closest('[data-ctg-toggle],[data-ctg-edit],[data-ctg-delete]');if(!b)return;if(b.hasAttribute('data-ctg-toggle')){var id=b.dataset.ctgToggle;expanded.has(id)?expanded.delete(id):expanded.add(id);if(w.ctRender)w.ctRender();}else if(!manage())return;else if(b.hasAttribute('data-ctg-edit'))w.ctEdit(b.dataset.ctgEdit);else w.ctDel(b.dataset.ctgDelete);});
document.addEventListener('click',function(e){var b=e.target.closest('[data-date-row]');if(!b||!w.ctHookHistory||!w.ctHookHistory.allowed())return;var id=b.dataset.dateRow,n=b.dataset.dateEmployee,r=(w.ctContentRows()||[]).find(x=>String(x.id)===id);if(!r)return;var dlg=document.createElement('dialog');dlg.className='ctg-date-dialog';dlg.innerHTML='<h3>แก้ไขวันที่ · '+esc(n)+'</h3><p>วันที่ย้อนหลังจากชีท ใช้แสดงใน Content Tracker เท่านั้น<br>ไม่เปลี่ยน Deadline งานจริงหรือยอดหัก</p><input type="date" aria-label="วันที่ย้อนหลัง"><p class="date-message" aria-live="polite"></p><button data-cancel>ยกเลิก</button> <button data-save>บันทึกวันที่</button>';document.body.appendChild(dlg);var input=dlg.querySelector('input');input.value=r.manualDeadlines&&r.manualDeadlines[n]&&r.manualDeadlines[n].date||'';dlg.querySelector('[data-cancel]').onclick=()=>dlg.close();dlg.addEventListener('close',()=>dlg.remove());dlg.querySelector('[data-save]').onclick=async function(){if(!input.value||!input.checkValidity()){dlg.querySelector('.date-message').textContent='กรุณาเลือกวันที่';return;}this.disabled=true;try{await w.ctSetManualDeadline(id,n,input.value);dlg.close();}catch(err){dlg.querySelector('.date-message').textContent='บันทึกยังไม่สำเร็จ กรุณาลองอีกครั้ง';this.disabled=false;}};dlg.showModal();});
w.addEventListener('rb:auth-cleared',()=>expanded.clear());w.ctGrouped={row:row,mount:mount,people:people,columns:columns,version:()=>String(manage())+':'+Array.from(expanded).join('|')};
})(window);

(function (w) {
  'use strict';
  const monthFormat = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit'
  });
  const thaiDate = new Intl.DateTimeFormat('th-TH', {
    timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit'
  });
  const code = name => w.rbOrderAssigneeCode(name);
  const norm = value => String(value || '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
  const hookKey = (brand, hook) => JSON.stringify([norm(brand), norm(hook)]);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  })[c]);
  function day(value) {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    if (!value) return '';
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return '';
    const parts = Object.fromEntries(monthFormat.formatToParts(date).map(part => [part.type, part.value]));
    return parts.year + '-' + parts.month + '-' + parts.day;
  }
  function display(value) {
    return value ? thaiDate.format(new Date(value + 'T00:00:00+07:00')) : '—';
  }
  function index(map, key, value) {
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(value);
  }
  function reportRows(rows, orders, employee, period) {
    const peers = new Map(), linked = new Map(), legacy = new Map();
    rows.forEach(row => index(peers, hookKey(row.brand, row.ready || row.hook), row));
    orders.filter(order => order && code(order.assignee) === employee).forEach(order => {
      const bindings = order.contentBindings || [];
      if (bindings.length) {
        new Set(bindings.map(binding => String(binding.id))).forEach(id => index(linked, id, order));
      } else {
        const keys = new Set([order, ...(order.jobExtra || [])].flatMap(job =>
          [job.hook, job.hook2, ...(job.hookExtra || [])].filter(Boolean).map(hook => hookKey(order.product, hook))
        ));
        keys.forEach(key => index(legacy, key, order));
      }
    });
    const [start, end] = period.split('/');
    const inPeriod = value => !!value && (!start || (end ? value >= start && value <= end : value === start));
    return rows.flatMap(row => {
      const key = hookKey(row.brand, row.ready || row.hook);
      const candidates = [...(linked.get(String(row.id)) || []), ...(legacy.get(key) || [])];
      const matched = candidates.length ? w.ctHookHistory.matches(row, candidates, peers.get(key)) : [];
      const manual = day(row.manualDeadlines?.[employee]?.date);
      const dates = [...new Set((manual ? [manual] : matched.map(order => day(order.deadline))).filter(inPeriod))].sort().reverse();
      const submitted = (w.ctSubmissions?.entries(row.id) || []).filter(entry => code(entry.ownerName) === employee)
        .flatMap(entry => [entry.updatedAt, ...Object.values(entry.history || {}).map(version => version?.updatedAt)])
        .map(day).filter(inPeriod).sort().pop();
      return dates.length || submitted ? [{row, dates, submitted, latest: [dates[0] || '', submitted || ''].sort().pop()}] : [];
    }).sort((a, b) => b.latest.localeCompare(a.latest));
  }

  function mount() {
    const team = document.getElementById('tab-team');
    const links = team?.querySelector('[data-sub="links"]');
    const nav = team?.querySelector('.graphic-subnav');
    if (!links || !nav) return false;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'gsnav-btn';
    button.dataset.rbSub = 'content-person';
    button.textContent = 'คอนเทนต์รายคน';
    nav.children[2].after(button);
    const panel = document.createElement('section');
    panel.className = 'gsp';
    panel.dataset.sub = 'content-person';
    panel.innerHTML = '<div class="ct-wrap"><div class="ct-header"><h2 class="ct-title">คอนเทนต์รายคน</h2><label>สินค้า <select aria-label="สินค้า"></select></label><label>วันที่ <input type="date" aria-label="วันที่" data-date-range=""></label><button type="button" class="ct-btn ct-btn-secondary" data-refresh>อัปเดตข้อมูล</button></div><div class="ct-actions" data-people aria-label="พนักงาน"></div><p role="status"></p><div class="ct-table-container" data-results></div></div>';
    links.after(panel);
    const product = panel.querySelector('select');
    const date = panel.querySelector('input[type=date]');
    const people = panel.querySelector('[data-people]');
    const status = panel.querySelector('[role="status"]');
    const results = panel.querySelector('[data-results]');
    let selected = '', loading = false, error = false;
    function render() {
      if (!panel.classList.contains('gsp-active')) return;
      if (!w.ctHookHistory?.allowed()) {
        product.replaceChildren();
        people.replaceChildren();
        results.replaceChildren();
        status.textContent = 'กรุณาเข้าสู่ระบบเพื่อดูรายการ';
        return;
      }
      const user = w._rbUser;
      const allRows = w.ctContentRows();
      const brand = product.value;
      const brands = [...new Set([...w.ctProductList(), ...allRows.map(row => row.brand)].filter(Boolean))];
      const options = ['<option value="">เลือกสินค้า</option>', ...brands.map(name =>
        '<option value="'+escape(name)+'">'+escape(name)+'</option>'
      )].join('');
      if (product.dataset.options !== options) {
        product.innerHTML = options;
        product.dataset.options = options;
        product.value = brands.includes(brand) ? brand : '';
      }
      const rows = allRows.filter(row => product.value && row.brand === product.value);
      const orders = w.lpORD?.() || [];
      const own = code(user.name);
      const teamView = ['sup','audit'].includes(user.role);
      const names = teamView ? [...new Set([
        ...(w.MB_GR || []),
        ...String(w.ctProductOwners?.()[product.value] || '').split(/[\s,]+/),
        ...orders.map(order => order?.assignee),
        ...rows.flatMap(row => [...Object.keys(row.manualDeadlines || {}), ...(w.ctSubmissions?.entries(row.id) || []).map(entry => entry.ownerName)])
      ].map(code).filter(Boolean))].sort() : [own].filter(Boolean);
      const available = names.filter(name => rows.length && reportRows(rows, orders, name, '').length);
      if (!available.includes(selected)) selected = '';
      people.innerHTML = available.map(name => '<button type="button" class="ct-btn '+(name === selected ? 'ct-btn-primary' : 'ct-btn-secondary')+'" data-person="'+escape(name)+'" aria-pressed="'+(name === selected)+'">'+escape(name)+'</button>').join('');
      const period = date.dataset.dateRange || date.value;
      const list = selected ? reportRows(rows, orders, selected, period) : [];
      status.textContent = (loading ? 'กำลังอัปเดตข้อมูล · ' : error ? 'อัปเดตไม่สำเร็จ · แสดงข้อมูลที่มีอยู่ · ' : '') +
        (!product.value ? 'เลือกสินค้าก่อน' :
          !available.length ? 'ยังไม่มีรายการของสินค้านี้' :
          !selected ? 'เลือกพนักงาน' :
          selected + ' · ' + (list.length ? list.length + ' รายการ' : 'ไม่พบคอนเทนต์ในวันที่เลือก'));
      results.innerHTML = list.length ? '<table class="ct-table" style="min-width:620px"><thead><tr><th>สินค้า</th><th>ชื่อตอน</th><th>HOOK</th><th>วันที่ในตาราง</th><th>ส่ง List Content</th><th>คลิป</th></tr></thead><tbody>'+list.map(({row,dates,submitted}) =>
        '<tr><td>'+escape(row.brand)+'</td><td>'+escape(row.episode || row.name || '—')+'</td><td>'+escape(row.ready || row.hook || '—')+'</td><td>'+dates.map(display).join('<br>')+(dates.length ? '' : '—')+'</td><td>'+display(submitted)+'</td><td>'+(/^https?:\/\//i.test(row.clipLink || '') ? '<a target="_blank" rel="noopener noreferrer" href="'+escape(row.clipLink)+'">เปิดคลิป</a>' : '—')+'</td></tr>'
      ).join('')+'</tbody></table>' : '';
    }
    async function refresh() {
      if (loading || !w.ctHookHistory?.allowed()) return;
      loading = true;
      error = false;
      render();
      const responses = await Promise.allSettled([
        Promise.resolve().then(() => w.refreshOrderContentFromCloud?.('', true)),
        Promise.resolve().then(() => w.ctSubmissions?.refresh())
      ]);
      error = responses.some(response => response.status === 'rejected');
      loading = false;
      render();
    }
    button.onclick = function () {
      team.querySelectorAll('.gsnav-active,.gsp-active').forEach(el => el.classList.remove('gsnav-active','gsp-active'));
      button.classList.add('gsnav-active');
      panel.classList.add('gsp-active');
      render();
      refresh();
    };
    people.onclick = function (event) {
      const choice = event.target.closest('[data-person]');
      if (choice) {
        selected = choice.dataset.person;
        render();
        people.querySelector('[aria-pressed="true"]')?.focus();
      }
    };
    product.onchange = function () { selected = ''; render(); };
    date.onchange = function () {
      if (!date.value) date.dataset.dateRange = '';
      render();
    };
    panel.querySelector('[data-refresh]').onclick = refresh;
    w.addEventListener('rb:content-updated', render);
    w.addEventListener('rb:auth-cleared', function () { selected = ''; people.replaceChildren(); results.replaceChildren(); status.textContent = ''; });
    w.addEventListener('rb:auth-ready', function () { render(); if (panel.classList.contains('gsp-active')) refresh(); });
    return true;
  }
  if (!mount() && typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(() => { if (mount()) observer.disconnect(); });
    observer.observe(document.documentElement, {childList:true,subtree:true});
  }
})(window);

