const fs = require('fs');
const assert = require('assert');

const source = fs.readFileSync('index.html', 'utf8');

assert(source.includes("function showOMSummary()"), 'order summary dialog is missing');
assert(source.includes("if(_omIsNew&&confirmed!==true){showOMSummary();return;}"), 'new orders must show the summary before saving');
assert(source.includes("ยืนยันสั่งงาน"), 'summary confirmation action is missing');
assert(source.includes("function setOMFieldError(id,message)"), 'field-level validation helper is missing');
assert(source.includes("firstMissing.scrollIntoView({behavior:'smooth',block:'center'})"), 'validation must scroll to the first invalid field');
assert(source.includes("function saveOMDraftNow()"), 'automatic draft persistence is missing');
assert(source.includes("function restoreOMDraft()"), 'draft restore is missing');
assert(source.includes("rb_order_draft_v1_"), 'draft key must be isolated from order storage');
assert(source.includes("if(_omIsNew&&state&&state.online){clearOMDraft();_omIsNew=false;}"), 'only a confirmed online new-order save may clear its draft');
assert(source.includes("กรุณาแนบรูปภาพใหม่"), 'draft restore must explain that images are not stored in localStorage');
assert(source.includes("sampleLink:ge('om-sample-link').value||''"), 'sample link must be preserved with the order');
assert(source.includes("ge('om-sample-link').value=o?(o.sampleLink||''):''"), 'sample link must be restored when editing an order');

console.log('order form ux v1 tests passed');
