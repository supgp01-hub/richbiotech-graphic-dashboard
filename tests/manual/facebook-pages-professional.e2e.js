const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const url = process.argv[2] || 'http://127.0.0.1:8014/index.html?qa=fix306';
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => {
    localStorage.setItem('rb_session', JSON.stringify({ name: 'View', role: 'sup', expiresAt: Date.now() + 3600000 }));
  });
  await context.route(/firebaseio\.com/, route => route.fulfill({ status: 200, contentType: 'application/json', body: 'null' }));
  await context.route(/docs\.google\.com\/spreadsheets/, route => route.fulfill({
    status: 200,
    contentType: 'text/csv; charset=utf-8',
    body: [
      'ชื่อเพจ,สินค้า,สถานะ,พนักงาน,Facebook ID',
      'เพจทดสอบ 1,ขุนแผน,ใช้งาน,MOS,10001',
      'เพจทดสอบ 2,จูโด้,ว่าง,JAM,10002',
      'เพจทดสอบ 3,ขุนแผน,โดนระงับถาวร,DOM,10003'
    ].join('\n')
  }));
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url, { waitUntil: 'commit', timeout: 60000 });
  await page.waitForSelector('#sidebar', { timeout: 90000 });
  await page.locator('#sidebar button').filter({ hasText: 'Graphic' }).click();
  await page.waitForSelector('#tab-team.active');
  await page.waitForFunction(() => typeof window._renderFbList === 'function', null, { timeout: 30000 });
  await page.locator('.gsnav-btn').filter({ hasText: 'Facebook Pages' }).click();
  await page.waitForFunction(() => !!window._renderFbList?._fbpInlineEditorV2, null, { timeout: 30000 });
  assert.equal(await page.evaluate(() => !!window._renderFbList?._fbpInlineEditorV2), true, 'professional renderer wrapper must be installed');
  await page.evaluate(() => window._renderFbList(document.querySelector('#fbl-root'), [
    { name: 'เพจทดสอบ 1', prod: 'ขุนแผน', st: 'ใช้งาน', own: 'MOS', emp: 'MOS', fbid: '10001' },
    { name: 'เพจทดสอบ 2', prod: 'จูโด้', st: 'ว่าง', own: 'JAM', emp: 'JAM', fbid: '10002' },
    { name: 'เพจทดสอบ 3', prod: 'ขุนแผน', st: 'โดนระงับถาวร', own: 'DOM', emp: 'DOM', fbid: '10003' }
  ]));
  await page.waitForSelector('#fbl-root.rb-fbp-professional', { timeout: 30000 });
  await page.waitForSelector('#fbl-body tr[data-name]');

  assert.equal(await page.locator('.rb-fbp-filter-select').count(), 3, 'three compact dropdown filters must be visible');
  assert.equal(await page.locator('.rb-fbp-table').evaluate(table => getComputedStyle(table).tableLayout), 'fixed');
  assert.deepEqual((await page.locator('.rb-fbp-employee').allTextContents()).sort(), ['DOM', 'JAM', 'MOS']);
  assert.equal(await page.locator('.rb-fbp-employee').locator('span').count(), 0, 'employee cells must contain names only');
  assert.equal(await page.locator('.rb-fbp-notification select').count(), 0, 'notification status must remain read-only');

  await page.locator('.rb-fbp-filter-field').filter({ hasText: 'พนักงาน' }).locator('select').selectOption('JAM');
  assert.deepEqual(await page.locator('#fbl-body tr[data-name]:visible .rb-fbp-employee').allTextContents(), ['JAM']);
  await page.locator('.rb-fbp-filter-reset').click();
  assert.equal(await page.locator('#fbl-body tr[data-name]:visible').count(), 3);

  const firstRow = page.locator('#fbl-body tr[data-name]').first();
  await firstRow.locator('.rb-fbp-row-edit').click();
  assert.equal(await firstRow.locator('select.rb-fbp-edit-field').count(), 3);
  await firstRow.locator('select.rb-fbp-edit-field').nth(2).selectOption('JAM');
  await firstRow.locator('.rb-fbp-row-save').click();
  await page.waitForFunction(() => document.querySelector('#fbl-body tr[data-name] .rb-fbp-employee')?.textContent.trim() === 'JAM');
  assert.equal((await page.locator('#fbl-body tr[data-name] .rb-fbp-employee').first().textContent()).trim(), 'JAM');

  await page.reload({ waitUntil: 'commit' });
  await page.waitForSelector('#sidebar', { timeout: 90000 });
  await page.locator('#sidebar button').filter({ hasText: 'Graphic' }).click();
  await page.waitForFunction(() => typeof window._renderFbList === 'function', null, { timeout: 30000 });
  await page.locator('.gsnav-btn').filter({ hasText: 'Facebook Pages' }).click();
  await page.waitForFunction(() => !!window._renderFbList?._fbpInlineEditorV2, null, { timeout: 30000 });
  await page.evaluate(() => window._renderFbList(document.querySelector('#fbl-root'), [
    { name: 'เพจทดสอบ 1', prod: 'ขุนแผน', st: 'ใช้งาน', own: 'MOS', emp: 'MOS', fbid: '10001' },
    { name: 'เพจทดสอบ 2', prod: 'จูโด้', st: 'ว่าง', own: 'JAM', emp: 'JAM', fbid: '10002' },
    { name: 'เพจทดสอบ 3', prod: 'ขุนแผน', st: 'โดนระงับถาวร', own: 'DOM', emp: 'DOM', fbid: '10003' }
  ]));
  await page.waitForSelector('#fbl-root.rb-fbp-professional');
  await page.waitForSelector('#fbl-body tr[data-name]');
  assert.equal((await page.locator('#fbl-body tr[data-name] .rb-fbp-employee').first().textContent()).trim(), 'JAM', 'saved employee must survive reload');
  assert.deepEqual(errors, [], `browser errors: ${errors.join(' | ')}`);

  console.log('facebook pages professional e2e: layout, filters, edit and reload persistence passed');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
