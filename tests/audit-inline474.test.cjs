const assert=require('node:assert/strict'),fs=require('fs'),{JSDOM}=require('jsdom');
(async()=>{
const dom=new JSDOM('<section data-sub="audit" class="gsp-active"></section>',{url:'https://example.test',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,d=w.document;
const observers=[],Observer=w.MutationObserver;w.MutationObserver=class extends Observer{constructor(fn){super(fn);observers.push(this)}};
w._rbUser={name:'JAM',role:'graphic'};w.lpORD=()=>[];w.setTimeout=()=>0;w.clearTimeout=()=>{};w.scrollBy=()=>{};w.fetch=()=>Promise.reject(Error('isolated test'));
const now=new Date(),period=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
const manual={};for(let i=1;i<=3;i++)manual['qa'+i]={id:'qa'+i,ref:'qa'+i,ruleId:'sheet_import',employee:'JAM',period,title:'รายการ '+i,detectedAt:now.getTime()-i*86400000,dueAt:now.getTime()-i*86400000,amount:50,sourceStatus:'หักเงินแล้ว',evidence:'https://example.test/proof/'+i};
manual.other={...manual.qa1,id:'other',employee:'DOM'};
w.localStorage.setItem('rb_audit_deductions_v1',JSON.stringify({manual}));
for(const file of ['deduction-reset-policy-v1.js','audit-deduction-center-v1.js'])w.eval(fs.readFileSync('snippets/'+file,'utf8'));
w._rbAuditDeductionMount();await Promise.resolve();await Promise.resolve();
const before=w.localStorage.getItem('rb_audit_deductions_v1');
function verify(id){const row=d.querySelector('[data-ledger-detail]');assert.equal(d.querySelectorAll('[data-ledger-detail]').length,1);assert.equal(row.previousElementSibling.dataset.ledgerItem,id);assert.equal(row.querySelectorAll('.adc-detail').length,1);assert.equal(d.querySelector('[data-item="'+id+'"]').getAttribute('aria-expanded'),'true');assert.equal(d.querySelectorAll('#adc-app>.adc-detail').length,0);}
assert.equal(d.querySelectorAll('[data-ledger-item]').length,3);assert.equal(d.querySelector('[data-item="other"]'),null);
d.querySelector('[data-item="qa2"]').click();verify('qa2');
d.querySelector('[data-item="qa1"]').click();verify('qa1');
d.querySelector('[data-item="qa1"]').click();assert.equal(d.querySelector('[data-ledger-detail]'),null);
d.querySelector('[data-item="qa2"]').click();w._rbAuditDeductionRefresh();verify('qa2');
const editor=d.createElement('div');editor.setAttribute('data-list-editor','qa2');editor.innerHTML='<input value="unsaved note">';d.querySelector('.adc-detail').appendChild(editor);editor.firstChild.dispatchEvent(new w.Event('input',{bubbles:true}));
w.confirm=()=>false;d.querySelector('[data-item="qa1"]').click();verify('qa2');assert.equal(editor.firstChild.value,'unsaved note','declining close keeps unsaved fields');
w.confirm=()=>true;d.querySelector('[data-item="qa1"]').click();verify('qa1');d.querySelector('[data-item="qa2"]').click();
d.querySelector('[data-close-detail]').click();assert.equal(d.querySelector('[data-ledger-detail]'),null);assert.equal(d.activeElement.dataset.item,'qa2');
assert.equal(w.localStorage.getItem('rb_audit_deductions_v1'),before,'expanding and collapsing must not change deductions');
observers.forEach(o=>o.disconnect());dom.window.close();console.log('PASS inline ledger adjacency, exclusive expansion, collapse, refresh, focus and employee boundaries');
})().catch(e=>{console.error(e);process.exitCode=1});
