const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const url = process.argv[2] || 'http://127.0.0.1:8014/tests/fixtures/list-facebook-swap.html?qa=fix389';
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('dialog', dialog => dialog.accept());
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => typeof window.rbOpenFacebookStatusGuide === 'function');

  await page.evaluate(() => window.rbOpenFacebookStatusGuide());
  await page.waitForSelector('#rb-fb-status-guide.is-open');
  assert.equal(await page.locator('[data-guide-action="edit"]').count(), 1, 'Supervisor must see the guide editor button');
  await page.locator('[data-guide-action="edit"]').click();
  assert.equal(await page.locator('.rb-fb-guide-card.is-editing').count() >= 30, true, 'all guide statuses must be editable');

  const firstSwitch = page.locator('[data-guide-follow="0"]');
  const before = await firstSwitch.isChecked();
  await firstSwitch.locator('xpath=..').click();
  await page.locator('[data-guide-action="edit-text"]').first().click();
  await page.locator('[data-guide-text="description"]').first().fill('ข้อความทดสอบจาก Supervisor');
  assert.equal(await page.locator('[data-guide-action="save"]').isEnabled(), true, 'save must enable after a change');
  await page.locator('[data-guide-action="save"]').click();
  await page.waitForFunction(() => window.__writes.some(write => write.path === '/facebook_status_catalog_v1'));
  const write = await page.evaluate(() => window.__writes.find(item => item.path === '/facebook_status_catalog_v1'));
  assert.equal(write.value.items[0].follow, !before, 'follow-up switch must persist');
  assert.equal(write.value.items[0].description, 'ข้อความทดสอบจาก Supervisor', 'edited guidance must persist');
  assert.equal(write.value.updatedBy, 'View', 'audit metadata must identify the Supervisor');

  await page.evaluate(() => { window.rbCloseFacebookStatusGuide(); window._rbUser={name:'Moss',role:'spec'}; window.rbOpenFacebookStatusGuide(); });
  await page.waitForSelector('#rb-fb-status-guide.is-open');
  assert.equal(await page.locator('[data-guide-action="edit"]').count(), 0, 'Specialist must have read-only access');
  assert.equal(await page.locator('[data-guide-follow]').count(), 0, 'read-only users must not see status switches');
  assert.deepEqual(errors, [], `browser errors: ${errors.join(' | ')}`);

  console.log('facebook status guide admin e2e: Supervisor edit/save and Specialist read-only passed');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
