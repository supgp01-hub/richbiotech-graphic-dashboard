const fs = require('fs');
const assert = require('assert');

const source = fs.readFileSync('index.html', 'utf8');

assert(source.includes('id="rb-order-modal-theme-v3"'), 'the refined shared order modal theme is missing');
assert(source.includes("_OM2.id='rb-order-modal'"), 'the order modal theme root is missing');
assert(source.includes("b.className='rb-om-tab'"), 'the three workflow tabs do not share the new tab component');
assert(source.includes("headerCode.id='om-header-code'"), 'the compact header job code is missing');
assert(source.includes("!p.parentElement.querySelector(':scope>.rb-om-brand-icon')"), 'the legacy icon pass must not add a duplicate modal icon');
assert(source.includes("footerHint.className='rb-om-footer-hint'"), 'the compact autosave status is missing');
assert(source.includes("_OM2.setAttribute('data-order-role',_orderRole||'guest')"), 'the shared modal does not expose the active user role');
assert(source.includes("_OM2.setAttribute('data-order-view',id?'detail':'new')"), 'the detail/new presentation state is missing');
assert(source.includes("canAudit=role==='sup'||isAuditRole"), 'audit actions are not restricted to Supervisor and Audit');
assert(source.includes("if(canAudit){if(isRev)"), 'the role-aware audit footer is missing');
assert(source.includes("_orderRole==='graphic'?'ดูรายละเอียด เปิดลิงก์ และส่งผลงาน'"), 'the Graphic detail guidance is missing');
assert(source.includes("decoratePanel(p1,'▤','รายละเอียดประเภทงาน'"), 'the job-type page is not using the shared panel layout');
assert(source.includes("decoratePanel(p2,'⌕','ตรวจออดิต'"), 'the audit page is not using the shared panel layout');
assert(source.includes("decoratePanel(p4,'▧','ส่งงานภาพ'"), 'the image-delivery page is not using the shared panel layout');
assert(source.includes("_omSaveBtn.textContent=_omViewMode?workerLabel:'▧ บันทึกส่งงานภาพ'"), 'the image page must use the role-aware delivery action label');
assert(source.includes("var submitLinkLabels=['VER 1.','VER 2.','เทสส่วนตัว'];"), 'delivery-link labels must remain unchanged');
assert(source.includes("p1.appendChild(mkProductAssetLink('ลิงก์ Footage','om-footage','footage'))"), 'Footage links must remain in the order form');
assert(source.includes("p1.appendChild(mkProductAssetLink('Insert / Review','om-review','review'))"), 'Insert / Review links must remain in the order form');

console.log('order modal theme v3 tests passed');
