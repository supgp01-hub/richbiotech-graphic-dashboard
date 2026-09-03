const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const target = process.argv[2] || 'http://127.0.0.1:8015/index.html?order-asset-roundtrip';
  const asset = { name: 'fix.jpg', type: 'image/jpeg', size: 12, data: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==' };
  const order = {
    id: 'GR998', _fbKey: 'qa_asset_order', name: 'Asset roundtrip', product: 'WOLF+', type: 'กราฟิก',
    deadline: '2026-09-08', status: 'revision', assignee: 'DOM', submitLinks: ['https://example.com/original'],
    assetCounts: { images: 0, briefImages: 0, errorImages: 0, fixImages: 1 }, assetsUpdatedAt: Date.now(),
    createdAt: Date.now(), updatedAt: Date.now()
  };
  let assets = { images: [], briefImages: [], errorImages: [], fixImages: [asset] };
  let assetPut = null;
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext();
  await context.addInitScript(order => {
    localStorage.setItem('rb_session', JSON.stringify({ name: 'Dom', role: 'graphic', expiresAt: Date.now() + 3600000 }));
    localStorage.setItem('rb_orders_v1', JSON.stringify([order]));
  }, order);
  await context.route(/firebaseio\.com/, async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname.endsWith('/order_assets/qa_asset_order.json')) {
      if (request.method() === 'PUT') { assetPut = JSON.parse(request.postData() || 'null'); assets = assetPut || { images: [], briefImages: [], errorImages: [], fixImages: [] }; }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(request.method() === 'GET' ? assets : true) });
    }
    if (url.pathname.endsWith('/orders.json')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ qa_asset_order: order }) });
    if (url.pathname.includes('/orders/qa_asset_order.json')) return route.fulfill({ status: 200, contentType: 'application/json', body: 'true' });
    return route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
  });
  const page = await context.newPage();
  await page.goto(target, { waitUntil: 'commit', timeout: 60000 });
  await page.waitForSelector('#sidebar', { timeout: 90000 });
  await page.waitForFunction(() => typeof window.openOM === 'function' && typeof window._rbInitOP === 'function', null, { timeout: 90000 });
  await page.evaluate(() => {
    const team = [...document.querySelectorAll('nav button')].find(button => (button.getAttribute('onclick') || '').includes("'team'"));
    window.showTab('team', team);
  });
  await page.locator('.gsnav-btn').filter({ hasText: 'สั่งงาน' }).click();
  await page.waitForSelector('[data-sub="order"].gsp-active');
  await page.getByRole('button', { name: 'แก้ไขงาน' }).first().click();
  await page.waitForSelector('#om-p1fix-gallery img', { state: 'visible' });
  await page.locator('#om-submitlinks-rows input').first().fill('https://drive.google.com/revision-fixed');
  await page.locator('#om-revision-note').fill('แก้ไขและแนบหลักฐานครบแล้ว');
  await page.locator('#om-primary-btn').click();
  await page.waitForSelector('#rb-order-modal', { state: 'hidden', timeout: 15000 });
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('rb_orders_v1') || '[]')[0]);
  assert.equal(saved.status, 'review', 'revision must move to review');
  assert.equal(saved.revisionSubmissions.at(-1).links[0], 'https://drive.google.com/revision-fixed');
  assert.equal(saved.revisionSubmissions.at(-1).note, 'แก้ไขและแนบหลักฐานครบแล้ว');
  assert.ok(assetPut && assetPut.fixImages.length === 1, 'existing fix evidence must survive status submission');
  await page.reload({ waitUntil: 'commit' });
  await page.waitForFunction(() => typeof window.openOM === 'function', null, { timeout: 90000 });
  await page.evaluate(() => { window._ordViewMode = 'team'; window.openOM('GR998'); });
  await page.waitForSelector('#om-p1fix-gallery img', { state: 'visible' });
  assert.equal(await page.locator('#om-p1fix-gallery img').count(), 1, 'evidence must lazy-load again after refresh');
  await browser.close();
  console.log('order asset roundtrip: all tests passed');
})().catch(error => { console.error(error); process.exit(1); });
