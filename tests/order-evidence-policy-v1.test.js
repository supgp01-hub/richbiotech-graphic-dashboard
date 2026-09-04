const assert=require('node:assert/strict');
const fs=require('node:fs');
const policy=require('../snippets/order-evidence-policy-v1.js');
const index=fs.readFileSync('index.html','utf8');

['กราฟิก','รูปภาพ','คัดคลิป','Rlees','สร้างเพจ'].forEach(type=>{
  assert.equal(policy.evidenceOptional(type),true,type+' must submit without an image or delivery link');
});
['ยิงแอด','เทสส่วนตัว','Retarget','',null].forEach(type=>{
  assert.equal(policy.evidenceOptional(type),false,String(type)+' must keep the evidence requirement');
});
assert.equal(policy.evidenceOptional('  RLEES  '),true,'type matching must tolerate case and surrounding spaces');
assert.equal(policy.evidenceRequired('กราฟิก','inprogress',false,false,false),false,'optional types must not require evidence for first submission');
assert.equal(policy.evidenceRequired('สร้างเพจ','revision',false,false,false),false,'optional types must not require evidence for revision submission');
assert.equal(policy.evidenceRequired('ยิงแอด','inprogress',false,false,false),true,'ad work must still require evidence');
assert.equal(policy.evidenceRequired('เทสส่วนตัว','revision',false,false,false),true,'private tests must still require a revision link');
assert.equal(policy.evidenceRequired('Retarget','inprogress',false,false,false),true,'Retarget work must keep the evidence requirement');
assert.equal(policy.evidenceRequired('ยิงแอด','inprogress',false,false,true),false,'required types may submit when a delivery link exists');
assert.equal(policy.evidenceRequired('ยิงแอด','revision',false,true,false),false,'a corrected image must satisfy revision evidence without also forcing a link');
assert.equal(policy.evidenceRequired('ยิงแอด','revision',false,false,true),false,'a revision link must satisfy revision evidence without also forcing an image');
assert.ok(index.includes('snippets/order-evidence-policy-v1.js?v=fix342'),'the evidence policy must load before order interactions');
assert.ok(index.includes('"สร้างเพจ","Retarget"'),'the work-type dropdown must include Retarget');
assert.ok(index.includes("'สร้างเพจ':'#1877F2',retarget:'#A855F7'"),'Retarget must have a visible dropdown color marker');
assert.ok(index.includes('if(!window.rbOrderEvidenceRequired||window.rbOrderEvidenceRequired('),'the submission guard must use the evidence policy and fail safely if it is unavailable');
assert.ok(index.includes("typeof _omImages!=='undefined'&&_omImages&&_omImages.length>0"),'the submission guard must count normal uploaded artwork as valid evidence');

console.log('order-evidence-policy-v1: all tests passed');
