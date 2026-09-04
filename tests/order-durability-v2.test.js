const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('index.html', 'utf8');
const durableQueue = fs.readFileSync('snippets/order-durable-queue-v1.js', 'utf8');

assert.match(source, /FB_ORDER_ASSET_FIELDS=\['images','briefImages','errorImages','fixImages'\]/,
  'large image evidence must be separated from order metadata');
assert.match(source, /fbSetSafely\('\/order_assets\/'\+row\._fbKey/,
  'order assets must persist through the durable per-order path');
assert.match(source, /fbLoadOrderAssets\(o\)\.then/,
  'historical evidence must lazy-load when an order is opened');
assert.match(source, /if\(_omUploadPending\).*กรุณารอจนรูปพร้อมก่อนบันทึก/,
  'save must be blocked while selected images are still processing');
assert.match(source, /persistOMAndFinish\(orders/,
  'modal actions must wait for a durable save receipt');
assert.match(source, /setTimeout\(function\(\)\{closeOM2\(true\);\},state\.online\?60:420\)/,
  'the modal must finish after either an online confirmation or a durable queued save');
assert.match(source, /function fbWaitOrderOp\(op,timeout\)[\s\S]*Date\.now\(\)-started>=limit/,
  'the save receipt must wait for online confirmation instead of resolving immediately');
assert.match(source, /state\.durable\|\|state\.confirmed/,
  'an online confirmation must remain valid when browser storage is full');
assert.match(durableQueue, /root\.indexedDB\.open\(DB_NAME,1\)/,
  'order actions must have an IndexedDB durability fallback when localStorage is full');
assert.match(durableQueue, /function done\(ok\)\{if\(ok\)\{resolve\(true\)/,
  'a fast network failure must not outrun a successful durable asset receipt');
assert.match(source, /setTimeout\(function\(\)\{finish\(false,true\);\},320\)/,
  'a durable save must finish promptly instead of waiting for the full network timeout');
assert.match(source, /assetsChanged=!old\|\|row\._assetsChanged===true/,
  'status-only actions must not re-upload unchanged image evidence');
assert.match(source, /order\._assetsChanged=omAssetSignature\(\)!==_omAssetBaseline/,
  'real image changes must still be detected and protected by the asset save receipt');
assert.match(source, /if\(!_omAssetsReady&&!options\.allowUnloadedAssets\)/,
  'status transitions must not be blocked by an unrelated historical image read');
assert.match(source, /persistOMAndFinish\(orders,\{allowUnloadedAssets:true,message:'กำลังส่งข้อมูลและสถานะงาน\.\.\.'/,
  'accept, submit, and resubmit must allow safe metadata-only persistence');
assert.match(source, /window\.fbFlushOrderQueue=function\(\)\{fbFlushOrderQueue\(true\);\}/,
  'the manual retry control must call a real exported queue flush');
assert.match(source, /if\(!fbIsLeader\(\)&&!force\)/,
  'an explicit user save must flush from the current tab instead of waiting for a stale leader');
assert.match(source, /fbFlushOrderQueue\(true\);setTimeout\(check,160\)/,
  'the durable save receipt must keep driving its own explicit queue operation');
assert.match(source, /old\.attempts=0;old\.nextAttemptAt=0/,
  'a fresh edit must reset retry backoff for its existing queued order');
assert.match(source, /legacyKey&&!active\[legacyKey\]\?legacyKey:'ord_'/,
  'legacy rows must keep a stable internal key instead of being deleted and recreated');
assert.match(source, /if\(_viewerCode&&!rbOrderMatchesAssignee\(o,_viewerCode\)\)return false/,
  'graphic users must only see work assigned to them');

console.log('order-durability-v2: all tests passed');
