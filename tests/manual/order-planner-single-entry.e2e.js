const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
  const targetUrl = process.argv[2] || 'http://127.0.0.1:8014/tests/fixtures/order-planner-harness.html?v=fix303';
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);
  const browserErrors = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && !/Failed to load resource/.test(message.text())) browserErrors.push(message.text());
  });
  await page.route('https://richbiotech-graphic-ads-default-rtdb.firebaseio.com/**', (route) => route.abort());
  await page.route('https://**', (route) => route.abort('blockedbyclient'));
  await page.addInitScript(() => {
    localStorage.setItem('rb_session', JSON.stringify({ name: 'วิว', role: 'sup', expiresAt: Date.now() + 3600000 }));
    localStorage.setItem('rb_users', JSON.stringify([{ name: 'วิว', role: 'sup', pin: '1111', pinChanged: true }]));
    localStorage.removeItem('rb_order_planner_drafts_v1');
  });
  await page.goto(targetUrl, { waitUntil: 'commit', timeout: 60000 });
  await page.waitForFunction(() => typeof window.rbOrderPlanner === 'object', null, { timeout: 20000 });
  await page.locator('#ord-planner-btn').waitFor({ state: 'visible' });
  await page.locator('#ord-planner-btn').click();
  await page.locator('#rb-order-planner.is-open').waitFor({ state: 'visible' });
  await page.locator('.rbp-content-status').waitFor({state:'visible'});
  assert.match(await page.locator('.rbp-content-status').innerText(),/เลือกสินค้า|กำลังโหลด Content Tracker/,'planner must show a usable Content Tracker state');
  assert.strictEqual(await page.locator('.rbp-drafts-layout').count(), 1, 'planner must use the approved split layout');
  assert.strictEqual(await page.locator('.rbp-draft-list').count(), 1, 'planner must show the draft list on the left');
  assert.strictEqual(await page.locator('.rbp-detail-editor').count(), 1, 'planner must show the single-entry form on the right');
  const editor = page.locator('.rbp-detail-editor');
  assert.strictEqual(await editor.locator('[data-field="workStatus"]').inputValue(), 'pending', 'the Add New status must default to pending');
  assert.strictEqual(await editor.locator('[data-upload="brief"]').count(), 1, 'the Add New sample-image upload must be present');
  assert.strictEqual(await editor.locator('.rbp-parity-guard').count(), 1, 'the Add New leave guard must be present');
  assert.strictEqual(await editor.locator('[data-field="contentChoice"] option').count(), 1, 'the job DropDown must wait for a product instead of rendering every Content Tracker row');
  assert.strictEqual(await editor.locator('[data-field="product"] option').count(), 13, 'the product DropDown must expose every product plus its placeholder');
  assert.strictEqual(await editor.locator('[data-field="assignee"] option').count(), 7, 'the assignee DropDown must expose the full Graphic team');
  await editor.locator('[data-field="product"]').selectOption('Liv CARE');
  assert.strictEqual(await editor.locator('[data-field="contentChoice"] option').count(), 3, 'selecting a product must show only matching Content Tracker jobs plus the placeholder');
  assert.strictEqual(await editor.locator('[data-field="footageLink"]').inputValue(), 'https://example.com/liv-footage', 'selecting a product must fill its Footage link');
  assert.strictEqual(await editor.locator('[data-field="reviewLink"]').inputValue(), 'https://example.com/liv-review', 'selecting a product must fill its Insert / Review link');
  await editor.locator('[data-field="contentChoice"]').selectOption('โปรโมชัน Valore Clinic');
  assert.strictEqual(await editor.locator('[data-field="name"]').inputValue(), 'โปรโมชัน Valore Clinic', 'the Content Tracker DropDown must copy the selected job name');
  assert.strictEqual(await editor.locator('[data-field="hook"] option').count(), 3, 'jobs with multiple versions must expose each Hook without mixing links');
  assert.strictEqual(await editor.locator('[data-field="rawLink"]').inputValue(), '', 'ambiguous versions must not choose a link before Hook is selected');
  await editor.locator('[data-field="hook"]').selectOption('สวยครบทุกโปรในที่เดียว');
  assert.strictEqual(await editor.locator('[data-field="hook"]').inputValue(), 'สวยครบทุกโปรในที่เดียว', 'matching Content Tracker data must fill Hook');
  assert.strictEqual(await editor.locator('[data-field="rawLink"]').inputValue(), 'https://example.com/raw', 'matching Content Tracker data must fill the raw link');
  assert.strictEqual(await editor.locator('[data-field="sheetLink"]').inputValue(), 'https://example.com/script', 'matching Content Tracker data must fill the script link');
  await editor.locator('[data-action="toggle-presets"]').click();
  await editor.locator('[data-action="apply-preset"]').first().click();
  await editor.locator('[data-field="brief"]').fill('ทำภาพโปรโมชัน 5 รูป ขนาด 1:1 และ 9:16');
  await editor.locator('[data-field="sampleLink"]').fill('https://example.com/brief');
  await editor.locator('[data-field="note"]').fill('ใช้โทนสีเดิมของแบรนด์');
  assert.match(await page.locator('.rbp-draft-item button strong').first().innerText(), /โปรโมชัน Valore Clinic/, 'the left list must update while typing in the right form');
  await page.getByRole('button', { name: '+ เพิ่มงาน', exact: true }).click();
  assert.strictEqual(await page.locator('.rbp-draft-item').count(), 2, 'Supervisor must be able to keep multiple drafts');
  await page.locator('.rbp-detail-editor [data-field="name"]').fill('Retarget ลูกค้าเก่า HPV+');
  await page.evaluate(() => document.querySelector('.rbp-draft-item [data-action="select-draft"]').click());
  assert.strictEqual(await page.locator('.rbp-detail-editor [data-field="brief"]').inputValue(), 'ทำภาพโปรโมชัน 5 รูป ขนาด 1:1 และ 9:16', 'switching jobs must preserve the first job brief');
  assert.strictEqual(await page.locator('.rbp-detail-editor [data-field="rawLink"]').inputValue(), 'https://example.com/raw', 'switching jobs must preserve reference links');
  await page.waitForTimeout(800);
  const savedDrafts = await page.evaluate(() => JSON.parse(localStorage.getItem('rb_order_planner_drafts_v1') || '[]'));
  assert.strictEqual(savedDrafts[0].brief, 'ทำภาพโปรโมชัน 5 รูป ขนาด 1:1 และ 9:16', 'the one-entry brief must autosave');
  assert.strictEqual(savedDrafts[0].sheetLink, 'https://example.com/script', 'the script link must autosave with the same draft');
  await page.locator('.rbp-draft-item').first().locator('[data-select="1"]').check();
  await page.getByRole('button', { name: 'ตั้งเวลางานที่เลือก', exact: true }).click();
  const scheduled = await page.evaluate(() => JSON.parse(localStorage.getItem('rb_order_planner_drafts_v1') || '[]')[0]);
  assert.strictEqual(scheduled.status, 'scheduled', 'the selected complete draft must be scheduled');
  assert.match(scheduled.orderId, /^GR\d+$/, 'a scheduled draft must reserve one visible GR number');
  assert.strictEqual(scheduled.brief, 'ทำภาพโปรโมชัน 5 รูป ขนาด 1:1 และ 9:16', 'scheduling must retain the complete brief');
  const built = await page.evaluate(() => window._rbOrderPlannerTest.buildOrder({
    id: 'draft_sync_test', orderId: 'GR990', name: 'งานซิงค์', product: 'Liv CARE', type: 'รูปภาพ', assignee: 'DOM', workStatus: 'in_progress',
    deadline: '2026-09-03', scheduledDate: '2026-09-01', dispatchTime: '08:30', brief: 'บรีฟเดียวใช้ทุกหน้า',
    hook: 'HOOK หลัก', hook2: 'HOOK สำรอง', sampleLink: 'https://example.com/sample', rawLink: 'https://example.com/raw',
    sheetLink: 'https://example.com/script', footageLink: 'https://example.com/footage', reviewLink: 'https://example.com/review', note: 'หมายเหตุ'
  }, 'DOM', Date.now()));
  assert.strictEqual(built.brief, 'บรีฟเดียวใช้ทุกหน้า');
  assert.strictEqual(built.hook, 'HOOK หลัก');
  assert.strictEqual(built.sampleLink, 'https://example.com/sample');
  assert.strictEqual(built.rawLink, 'https://example.com/raw');
  assert.strictEqual(built.sheetLink, 'https://example.com/script');
  assert.strictEqual(built.footageLink, 'https://example.com/footage');
  assert.strictEqual(built.reviewLink, 'https://example.com/review');
  assert.strictEqual(built.note, 'หมายเหตุ');
  assert.strictEqual(built.status, 'in_progress');
  assert.deepStrictEqual(browserErrors, [], 'planner must not produce browser errors');
  const workerPage = await browser.newPage();
  await workerPage.goto(targetUrl + '&role=graphic', { waitUntil: 'domcontentloaded' });
  await workerPage.waitForFunction(() => typeof window.rbOrderPlanner === 'object');
  await workerPage.waitForTimeout(1900);
  assert.strictEqual(await workerPage.locator('#ord-planner-btn').isVisible(), false, 'non-Supervisor users must not see the planner entry');
  assert.strictEqual(await workerPage.evaluate(() => window.rbOrderPlanner.open()), false, 'non-Supervisor users must not open the planner API');
  await workerPage.close();
  console.log('order planner single-entry e2e: all tests passed');
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
