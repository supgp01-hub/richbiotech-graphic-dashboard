const assert=require('node:assert/strict');
const fs=require('node:fs');

const index=fs.readFileSync('index.html','utf8');
const workflow=fs.readFileSync('snippets/order-audit-version-workflow-v1.js','utf8');
const persistence=fs.readFileSync('snippets/order-audit-persistence-v1.js','utf8');
const css=fs.readFileSync('snippets/order-audit-version-workflow-v1.css','utf8');

assert.ok(index.includes('order-audit-version-workflow-v1.css?v=fix282'),'the version audit layout must be cache-busted');
assert.ok(index.includes('order-audit-version-workflow-v1.js?v=fix282'),'the version audit runtime must be cache-busted');
assert.ok(index.includes('✕ ยังไม่ได้อัพ'),'missing source data must be explicit in the Audit status fields');
assert.ok(workflow.includes("return current==='sup'||current==='audit'"),'Supervisor and Audit must be able to record audit results');
assert.ok(workflow.includes("return role()==='graphic'"),'Graphic employees must receive the evidence resubmission view');
assert.ok(workflow.includes("control.closest('#rb-audit-version-workflow')"),'employee access must stay limited to the version evidence workflow');
assert.ok(workflow.includes("control.disabled=true"),'the original Audit fields must stay read-only for employees');
assert.ok(workflow.includes('auditImages:Array.isArray(old.auditImages)'),'Audit error images must persist per version');
assert.ok(workflow.includes('fixImages:Array.isArray(old.fixImages)'),'employee proof images must persist per version');
assert.ok(workflow.includes('ระบุว่าเวอร์ชันนี้ผิดอะไร'),'Audit must be able to explain each incorrect version');
assert.ok(workflow.includes('บันทึกหลักฐานและส่งตรวจอีกครั้ง'),'employees must be able to resubmit their proof');
assert.ok(workflow.includes('class="rb-av-copy"'),'each version link must provide a copy button');
assert.ok(workflow.includes('navigator.clipboard.writeText'),'copy buttons must copy the complete link');
assert.ok(persistence.includes('order.auditVersions=window.rbCollectAuditVersionWorkflow(workflow)'),'all version results and images must save with the order');
assert.ok(index.includes("fbName:'om-fbname'")||persistence.includes("fbName:'om-fbname'"),'the existing Facebook Audit field must remain');
assert.ok(index.includes('om-audit-note'),'the existing Audit note must remain');
assert.ok(css.includes('.rb-av-evidence-grid'),'Audit and employee evidence must be visually separated');
assert.ok(css.includes('@media(max-width:720px)'),'the workflow must have a mobile layout');

console.log('order-audit-version-workflow-v1: all tests passed');
