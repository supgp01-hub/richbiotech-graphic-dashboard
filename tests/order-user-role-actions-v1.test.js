const fs=require('fs');
const assert=require('assert');
const index=fs.readFileSync('index.html','utf8');

assert.ok(index.includes("'moss':'MOS'"),'English Moss login must map to MOS orders');
assert.ok(index.includes("'dom':'DOM'"),'English Dom login must map to DOM orders');
assert.ok(index.includes("'ter':'TER'"),'English Ter login must map to TER orders');
assert.ok(index.includes("'nune':'NUNE'"),'English Nune login must map to NUNE orders');
assert.ok(index.includes("'jam':'JAM'"),'English Jam login must map to JAM orders');
assert.ok(index.includes("'ball':'BALL'"),'English Ball login must map to BALL orders');
assert.ok(index.includes('window.rbOrderAssigneeCode=rbOrderAssigneeCode'),'all role views must share one assignee mapper');
assert.ok(index.includes('window.rbOrderMatchesAssignee=rbOrderMatchesAssignee'),'all user surfaces must share normalized assignee matching');
assert.ok(index.includes("var leaveReady=typeof lvGetCycle==='function'"),'assigned work must still render while leave data is initializing');
assert.ok(index.includes('orders.filter(function(o){ return rbOrderMatchesAssignee(o,code); })'),'my-work cards must use normalized assignee matching');
assert.ok(index.includes('rbOrderAssigneeCode(e.name)===rbOrderAssigneeCode(u.name)'),'English Ball login must select the Thai Ball employee card by normalized assignee code');
console.log('order-user-role-actions-v1: all tests passed');
