const assert = require('node:assert/strict');
const fs = require('node:fs');

global.window = global;
global.localStorage = { getItem() { return null; }, setItem() {} };
global.document = { getElementById() { return null; } };
eval(fs.readFileSync('snippets/list-facebook-editor.js', 'utf8'));

const csv = [
  'ประเภท,คอลัมน์ B,พนักงาน,สินค้า,คอลัมน์ E,สถานะ,ชื่อบัญชี,Facebook ID,รหัสผ่าน,Email,รหัส Email,2FA,คอลัมน์ M,คอลัมน์ N,ลิมิต/วัน,คอลัมน์ P,อัปเดตล่าสุด,ยอดเงิน,หมายเหตุ',
  'บัญชีเล็ก,,MOS,Liv CARE,,ใช้งาน,Naga Ontare,1000012345678901,FbPass123,demo@example.com,MailPass456,ABCDEF123456,,,5000,,21/08/2569 16:44,5456.15,บัญชีหลัก',
  'บัญชีใหญ่,,DOM,Olymplus,,ว่าง,"ชื่อ, มีคอมมา",1000099999999999,P2,second@example.com,M2,ZXCVBN,,,12000,,20/08/2569 11:20,2052.30,"หมายเหตุ, ทดสอบ"'
].join('\n');

const rows = window._lfbEditorTest.parseCsv(csv);
assert.equal(rows.length, 2);
assert.equal(rows[0].fbid, '1000012345678901');
assert.equal(rows[0].passFb, 'FbPass123');
assert.equal(rows[0].email, 'demo@example.com');
assert.equal(rows[0].emailPass, 'MailPass456');
assert.equal(rows[0].twofa, 'ABCDEF123456');
assert.equal(rows[0].note, 'บัญชีหลัก');
assert.equal(rows[1].name, 'ชื่อ, มีคอมมา');
assert.equal(rows[1].note, 'หมายเหตุ, ทดสอบ');

const key = window._lfbEditorTest.rowKey(rows[0]);
const merged = window._lfbEditorTest.applyStored(rows, { [key]: { note: 'แก้ไขแล้ว', bal: '6000' } }, [{ id: 'manual-1', name: 'บัญชีใหม่', fbid: '2000' }]);
assert.equal(merged.length, 3);
assert.equal(merged[0].note, 'แก้ไขแล้ว');
assert.equal(merged[0].bal, '6000');
assert.equal(merged[2]._source, 'manual');

console.log('list-facebook-editor: all tests passed');
