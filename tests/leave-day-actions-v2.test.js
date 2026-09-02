const assert=require('node:assert/strict');
const fs=require('node:fs');

const html=fs.readFileSync('index.html','utf8');
const source=fs.readFileSync('snippets/leave-day-actions-v2.js','utf8');
const css=fs.readFileSync('snippets/leave-day-actions-v2.css','utf8');

assert.ok(html.includes('leave-day-actions-v2.css?v=fix327'));
assert.ok(html.includes('leave-day-actions-v2.js?v=fix327'));
assert.ok(source.includes("var VERSION='2.3.0'"));
assert.ok(source.includes('button.disabled=!options.nonBlocking'));
assert.ok(source.includes('removeLegacyJobBadges'));
assert.ok(source.includes("mode=box&&box.getAttribute('data-lvw-mode')||'leave'"));
assert.ok(source.includes("mode==='special'?'#lvw-combined-special':'#lvw-combined-leave'"));
assert.ok(source.includes('ลงข้อมูลวันนี้'));
assert.ok(!source.includes("hint.textContent='วันนี้ · กดเพื่อลงหรือแก้ไข'"));
assert.ok(source.includes("document.querySelector('#lvw-topbar .lvw-topbar-actions')"));
assert.ok(source.includes('บันทึกออนไลน์แล้ว'));
assert.ok(source.includes('เก็บข้อมูลไว้แล้ว · รอซิงก์'));
assert.ok(source.includes('ไม่ทับข้อมูลพนักงานคนอื่น'));
assert.ok(source.includes('root.rbLeaveFinishSave=finishSave'));
assert.ok(css.includes('.lvw-open-today'));
assert.ok(css.includes('.lvw-today-action'));
assert.ok(css.includes('.lvw-persist-feedback.is-saved'));
assert.ok(html.includes('onclick="lvSaveRow('+"'"+'+uid+'+"'"+',this)"'));
console.log('leave-day-actions-v2: today action and confirmed-save UI checks passed');
