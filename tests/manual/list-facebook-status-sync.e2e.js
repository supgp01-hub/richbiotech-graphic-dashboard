const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
  const targetUrl = process.argv[2] || 'http://127.0.0.1:8014/tests/fixtures/list-facebook-swap.html?v=fix296';
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  page.setDefaultTimeout(20000);
  const browserErrors = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && !/Failed to load resource/.test(message.text())) browserErrors.push(message.text());
  });
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.locator('#lfb-account-save').waitFor({ state: 'visible' });

  await page.locator('#lfb-add').click();
  await page.locator('#lfb-editor-overlay.is-open').waitFor({ state: 'visible' });
  await page.locator('#lfbe-name').fill('QA Add Account');
  await page.locator('#lfb-editor-save').click();
  await page.waitForFunction(() => (window._listfbData || []).some((item) => item && item.name === 'QA Add Account'));
  assert.ok((await page.evaluate(() => window.__writes)).some((write) => /\/listfacebook_manual\//.test(write.path)), 'adding an account must write through the shared manual-account path');

  const fordRow = page.locator('.lfb-follow-row').filter({ hasText: 'Ford Mustang' });
  assert.match(await fordRow.locator('.lfb-stage-cell').innerText(), /ยังไม่เริ่ม/, 'the fixture must begin in the old tracked state');

  await fordRow.locator('.lfb-name-btn').click();
  await page.locator('#lfb-followup-overlay.is-open').waitFor({ state: 'visible' });
  const stageOptions = await page.locator('#lfb-follow-stage-input option').allTextContents();
  assert.deepStrictEqual(stageOptions, ['ยังไม่เริ่ม', 'กำลังแก้', 'แก้แล้ว'], 'รอ Facebook must be removed from the tracking choices');
  await page.locator('.lfb-followup-close').click();

  await fordRow.click();
  await page.locator('#lfbi-note').fill('Draft must survive refresh');
  await page.evaluate(() => window._lfbRender());
  assert.equal(await page.locator('#lfbi-note').inputValue(), 'Draft must survive refresh', 'background rendering must not erase a field while the user is typing');

  await page.locator('#lfbi-st').selectOption('เปลี่ยนเฟสใหม่แล้ว');
  await page.locator('#lfb-account-save').click();
  await page.waitForFunction(() => {
    const row = (window._listfbData || []).find((item) => item && item.name === 'Ford Mustang');
    return row && row.st === 'เปลี่ยนเฟสใหม่แล้ว';
  });

  const updatedRow = page.locator('.lfb-follow-row').filter({ hasText: 'Ford Mustang' });
  assert.match(await updatedRow.locator('.lfb-status-cell').innerText(), /เปลี่ยนเฟสใหม่แล้ว/, 'the Facebook status must update immediately after save');
  assert.match(await updatedRow.locator('.lfb-stage-cell').innerText(), /ไม่ติดตาม/, 'a safe Facebook status must leave the tracking queue');
  assert.strictEqual((await updatedRow.locator('.lfb-updated').innerText()).trim(), '-\nไม่ติดตาม', 'a safe status must clear the next follow-up date');

  const savedState = await page.evaluate(() => {
    const map = JSON.parse(localStorage.getItem('rb_listfacebook_followups_v1') || '{}');
    return { followup: map[window.__fordKey], writes: window.__writes };
  });
  assert.strictEqual(savedState.followup.stage, 'none');
  assert.strictEqual(savedState.followup.nextDate, '');
  assert.ok(savedState.writes.some((write) => write.path === '/listfacebook_edits/' + savedState.followup.key && write.value.st === 'เปลี่ยนเฟสใหม่แล้ว'), 'the account status must sync to the shared edit record');
  assert.ok(savedState.writes.some((write) => write.path === '/listfacebook_followups/' + savedState.followup.key && write.value.stage === 'none'), 'the tracking closure must sync to the shared follow-up record');

  await updatedRow.locator('.lfb-name-btn').click();
  await page.locator('#lfb-followup-overlay.is-open').waitFor({ state: 'visible' });
  assert.match(await page.locator('#lfb-followup-body').innerText(), /สถานะนี้ไม่ต้องติดตาม/, 'safe accounts must show a read-only no-tracking result');
  assert.strictEqual(await page.locator('#lfb-follow-stage-input').count(), 0, 'safe accounts must not be placed back into a tracking stage manually');
  assert.deepStrictEqual(browserErrors, [], 'the synchronized workflow must not produce browser errors');

  console.log('list Facebook status sync e2e: all tests passed');
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
