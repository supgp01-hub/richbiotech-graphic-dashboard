const fs = require('fs');
const assert = require('assert');

const source = fs.readFileSync('index.html', 'utf8');

assert(source.includes("id+'-asset-list'"), 'product asset list container is missing');
assert(source.includes('data-product-asset-select'), 'selectable product asset rows are missing');
assert(source.includes("meta.textContent='พบ '+urls.length+' ลิงก์ของ '+product"), 'visible product link count is missing');
assert(source.includes("address.textContent=url"), 'full product asset URL is not rendered');
assert(source.includes("navigator.clipboard.writeText(url)"), 'copy-link action is missing');
assert(source.includes("window.open(url,'_blank')"), 'single-link open action is missing');
assert(!source.includes("openAll.textContent='เปิดทั้งหมด'"), 'open-all product link button must be removed');

console.log('product asset links v1 tests passed');
