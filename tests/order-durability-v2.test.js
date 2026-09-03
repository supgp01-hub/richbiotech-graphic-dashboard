const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('index.html', 'utf8');

assert.match(source, /FB_ORDER_ASSET_FIELDS=\['images','briefImages','errorImages','fixImages'\]/,
  'large image evidence must be separated from order metadata');
assert.match(source, /fbSet\('\/order_assets\/'\+row\._fbKey/,
  'order assets must persist to their own per-order path');
assert.match(source, /fbLoadOrderAssets\(o\)\.then/,
  'historical evidence must lazy-load when an order is opened');
assert.match(source, /if\(_omUploadPending\).*กรุณารอจนรูปพร้อมก่อนบันทึก/,
  'save must be blocked while selected images are still processing');
assert.match(source, /persistOMAndFinish\(orders/,
  'modal actions must wait for a durable save receipt');
assert.match(source, /setTimeout\(function\(\)\{closeOM2\(true\);\},60\)/,
  'the modal must close automatically after a safe save');
assert.match(source, /legacyKey&&!active\[legacyKey\]\?legacyKey:'ord_'/,
  'legacy rows must keep a stable internal key instead of being deleted and recreated');
assert.match(source, /if\(_viewerCode&&!rbOrderMatchesAssignee\(o,_viewerCode\)\)return false/,
  'graphic users must only see work assigned to them');

console.log('order-durability-v2: all tests passed');
