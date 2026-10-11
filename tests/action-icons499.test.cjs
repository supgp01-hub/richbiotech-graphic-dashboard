const fs=require('fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const dom=new JSDOM('<body></body>',{runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,d=w.document;
const fixtures=[['order','class="rb-order-edit-btn"','แก้ไข','edit'],['personal','aria-label="แก้ไขงาน"','✎','edit'],['draft','data-action="delete"','ลบ','delete'],['calendar','data-pc-edit','แก้ไขงาน','edit'],['content','aria-label="ลบคอนเทนต์"','🗑','delete'],['content-edit','aria-label="แก้ไขคอนเทนต์"','✎','edit'],['pages','data-fpid="manual-key"','🗑','delete'],['accounts','','ลบบัญชี','delete'],['idcard','class="ic-del-btn"','×','delete'],['leave','data-leave-edit="a"','แก้ไข','edit'],['special','data-sw-delete="a"','ลบ','delete'],['report','data-report-delete="a"','ลบ','delete'],['audit','','แก้ไขบัญชีนี้','edit'],['attachment','aria-label="ลบรูป"','×','delete'],['guide','data-guide-action="edit"','แก้ไขคู่มือ','edit']];
d.body.innerHTML=fixtures.map(([id,a,t])=>`<button id="${id}" ${a}>${t}</button>`).join('')+'<button id="status">ต้องแก้ไข</button><button id="submit">ส่งงานแก้ไข</button><button id="bulk">ลบที่เลือก</button><button id="save">บันทึกการแก้ไข</button>';
let clicked=0;d.getElementById('pages').onclick=()=>clicked++;
w.eval(fs.readFileSync('snippets/action-icons-v1.js','utf8'));
for(const [id,,,kind] of fixtures){const b=d.getElementById(id);assert(b.classList.contains('rb-action-'+kind),id);assert(b.getAttribute('aria-label'));}
for(const id of ['status','submit','save'])assert(!d.getElementById(id).classList.contains('rb-action-standard'),id);
assert(d.getElementById('bulk').classList.contains('rb-action-labeled'));
const b=d.getElementById('pages');b.click();assert.equal(clicked,1);assert.equal(b.dataset.fpid,'manual-key');b.disabled=true;b.click();assert.equal(clicked,1);
const hidden=d.getElementById('personal');hidden.style.display='none';w.rbActionIcons.scan();assert.equal(hidden.style.display,'none');
const guide=d.getElementById('guide');guide.textContent='บันทึกการแก้ไข';w.rbActionIcons.scan();assert(!guide.classList.contains('rb-action-standard'));assert.equal(guide.getAttribute('aria-label'),null);
d.body.insertAdjacentHTML('beforeend','<button data-report-edit="new" id="new">แก้ไข</button>');w.rbActionIcons.scan();assert(d.getElementById('new').classList.contains('rb-action-edit'));
w.rbActionIcons.destroy();dom.window.close();console.log('PASS 14 action contexts; existing handler/identity/disabled/hidden state; bulk labels and workflow exclusions');
