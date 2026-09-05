const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { installSecureAuthMock } = require('./secure-auth-mock');

(async () => {
  const targetUrl = process.argv[2] || 'http://127.0.0.1:8014/index.html?v=fix353-listfacebook';
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  await installSecureAuthMock(context, { role: 'sup', name: 'View' });
  await context.addInitScript(() => {
    const rows = [{ sourceRow: 2, type: 'บัญชีเล็ก', name: 'Full Page Account', emp: 'BALL', prod: 'So Pink', st: 'ใช้งาน', fbid: '123456789', follow: '', note: 'เดิม' }];
    localStorage.setItem('rb_listfacebook_base_v1', JSON.stringify(rows));
    localStorage.setItem('rb_listfacebook_edits_v1', '{}');
    localStorage.setItem('rb_listfacebook_manual_v1', '[]');
    localStorage.setItem('rb_listfacebook_source_schema_v5', '5');
  });
  await context.route(/docs\.google\.com\/spreadsheets/, (route) => route.fulfill({ status: 200, contentType: 'text/csv; charset=utf-8', body: 'ประเภท,,พนักงาน,สินค้า,,สถานะ,ชื่อบัญชี,Facebook ID,,,,,,,,ต้องติดตาม,อัปเดตล่าสุด,ยอดเงิน,หมายเหตุ\nบัญชีเล็ก,,BALL,So Pink,,ใช้งาน,Full Page Account,123456789,,,,,,,,,,เดิม' }));

  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(targetUrl, { waitUntil: 'commit', timeout: 60000 });
  await page.waitForFunction(() => window._rbUser && window._rbUser.role === 'sup' && typeof window._lfbEditorActivate === 'function', null, { timeout: 90000 });
  await page.locator('#sidebar button').filter({ hasText: 'Graphic' }).click();
  await page.locator('.gsnav-btn').filter({ hasText: 'List Facebook' }).click();
  await page.locator('#lfb-account-save').waitFor({ state: 'visible', timeout: 20000 });

  await page.locator('#lfbi-name').fill('Full Page Account Edited');
  await page.locator('#lfbi-note').fill('แก้ไขจากหน้าจริง');
  await page.locator('#lfb-account-save').click();
  await page.waitForFunction(() => (window._listfbData || []).some((row) => row.name === 'Full Page Account Edited' && row.note === 'แก้ไขจากหน้าจริง'));
  const editReceipt = await page.evaluate(() => JSON.parse(localStorage.getItem('rb_listfacebook_edits_v1') || '{}'));
  assert.equal(Object.values(editReceipt)[0].name, 'Full Page Account Edited');

  await page.locator('#lfb-add').click();
  await page.locator('#lfb-editor-overlay.is-open').waitFor({ state: 'visible' });
  await page.locator('#lfbe-name').fill('Full Page Manual');
  await page.locator('#lfbe-emp').fill('BALL');
  await page.locator('#lfbe-note').fill('เพิ่มจากหน้าจริง');
  await page.locator('#lfb-editor-save').click();
  await page.waitForTimeout(500);
  const addDiagnostic = await page.evaluate(() => ({
    names: (window._listfbData || []).map((row) => row.name),
    manual: localStorage.getItem('rb_listfacebook_manual_v1'),
    state: document.getElementById('lfb-editor-state') && document.getElementById('lfb-editor-state').textContent,
    error: document.getElementById('lfb-editor-error') && document.getElementById('lfb-editor-error').textContent,
    values: ['name', 'emp', 'note'].map((key) => document.getElementById('lfbe-' + key) && document.getElementById('lfbe-' + key).value),
    overlay: document.getElementById('lfb-editor-overlay') && document.getElementById('lfb-editor-overlay').className
  }));
  if (!addDiagnostic.names.includes('Full Page Manual')) console.error('add diagnostic', addDiagnostic);
  await page.waitForFunction(() => (window._listfbData || []).some((row) => row.name === 'Full Page Manual'));
  await page.locator('#lfb-editor-overlay').waitFor({ state: 'hidden' });

  const manualRow = page.locator('.lfb-follow-row').filter({ hasText: 'Full Page Manual' });
  await manualRow.locator('.lfb-employee').click();
  await page.locator('#lfbi-name').fill('Full Page Manual Edited');
  await page.locator('#lfb-account-save').click();
  await page.waitForFunction(() => (window._listfbData || []).some((row) => row.name === 'Full Page Manual Edited'));
  const manualReceipt = await page.evaluate(() => JSON.parse(localStorage.getItem('rb_listfacebook_manual_v1') || '[]'));
  assert.equal(manualReceipt.length, 1);
  assert.equal(manualReceipt[0].name, 'Full Page Manual Edited');
  assert.deepEqual(errors, []);

  console.log('list Facebook full-page add/edit: all tests passed');
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
