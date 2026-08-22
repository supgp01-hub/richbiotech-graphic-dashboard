const fs = require('fs');
const assert = require('assert');

const source = fs.readFileSync('index.html', 'utf8');

assert(source.includes('id="rb-order-modal-theme-v2"'), 'the shared order modal theme is missing');
assert(source.includes("_OM2.id='rb-order-modal'"), 'the order modal theme root is missing');
assert(source.includes("b.className='rb-om-tab'"), 'the three workflow tabs do not share the new tab component');
assert(source.includes("decoratePanel(p1,'▤','รายละเอียดประเภทงาน'"), 'the job-type page is not using the shared panel layout');
assert(source.includes("decoratePanel(p2,'⌕','ตรวจออดิต'"), 'the audit page is not using the shared panel layout');
assert(source.includes("decoratePanel(p4,'▧','ส่งงานภาพ'"), 'the image-delivery page is not using the shared panel layout');
assert(source.includes("_omSaveBtn.textContent='▧ บันทึกส่งงานภาพ'"), 'the image page must not show the order action label');
assert(source.includes("var submitLinkLabels=['VER 1.','VER 2.','เทสส่วนตัว'];"), 'delivery-link labels must remain unchanged');
assert(source.includes("p1.appendChild(mkProductAssetLink('ลิงก์ Footage','om-footage','footage'))"), 'Footage links must remain in the order form');
assert(source.includes("p1.appendChild(mkProductAssetLink('Insert / Review','om-review','review'))"), 'Insert / Review links must remain in the order form');

console.log('order modal theme v2 tests passed');
