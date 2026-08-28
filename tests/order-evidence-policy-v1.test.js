const assert=require('node:assert/strict');
const fs=require('node:fs');
const policy=require('../snippets/order-evidence-policy-v1.js');
const index=fs.readFileSync('index.html','utf8');

['กราฟิก','รูปภาพ','คัดคลิป','Rlees','สร้างเพจ'].forEach(type=>{
  assert.equal(policy.evidenceOptional(type),true,type+' must submit without an image or delivery link');
});
['ยิงแอด','เทสส่วนตัว','',null].forEach(type=>{
  assert.equal(policy.evidenceOptional(type),false,String(type)+' must keep the evidence requirement');
});
assert.equal(policy.evidenceOptional('  RLEES  '),true,'type matching must tolerate case and surrounding spaces');
assert.equal(policy.evidenceRequired('กราฟิก','inprogress',false,false,false),false,'optional types must not require evidence for first submission');
assert.equal(policy.evidenceRequired('สร้างเพจ','revision',false,false,false),false,'optional types must not require evidence for revision submission');
assert.equal(policy.evidenceRequired('ยิงแอด','inprogress',false,false,false),true,'ad work must still require evidence');
assert.equal(policy.evidenceRequired('เทสส่วนตัว','revision',false,false,false),true,'private tests must still require a revision link');
assert.equal(policy.evidenceRequired('ยิงแอด','inprogress',false,false,true),false,'required types may submit when a delivery link exists');
assert.ok(index.includes('snippets/order-evidence-policy-v1.js?v=fix292'),'the evidence policy must load before order interactions');
assert.ok(index.includes('if(!window.rbOrderEvidenceRequired||window.rbOrderEvidenceRequired('),'the submission guard must use the evidence policy and fail safely if it is unavailable');

console.log('order-evidence-policy-v1: all tests passed');
