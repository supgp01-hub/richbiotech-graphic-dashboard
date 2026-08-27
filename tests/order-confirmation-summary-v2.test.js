const fs = require('fs');
const path = require('path');
const assert = require('assert');

const source = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert(source.includes("add('Hook',hookValues.length?hookValues.join(' • '):'ยังไม่ได้เลือก',true)"), 'confirmation summary must show Hook values');
assert(source.includes("mkF('ลิงก์ตัวอย่าง/ลิงก์รายละเอียดงาน',mkLink('om-sample-link'))"), 'new order form must use the approved sample/detail link label');
assert(source.includes("revisionUniformLinkRows('ลิงก์ตัวอย่าง/ลิงก์รายละเอียดงาน',[order.sampleLink]"), 'detail view must use the approved sample/detail link label');
assert(!source.includes("addClipBtn.textContent='+ เพิ่มลิงก์ยิงแอด'"), 'legacy add-ad-link button must not be rendered');
assert(source.includes("clipExDiv.hidden=true"), 'legacy clip data container must remain hidden so existing stored links are preserved');

console.log('order-confirmation-summary-v2: ok');
