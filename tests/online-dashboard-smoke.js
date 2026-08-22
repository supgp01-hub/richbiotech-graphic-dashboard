const { chromium } = require('playwright');

const url = process.argv[2];
if (!url) throw new Error('Usage: node tests/online-dashboard-smoke.js <url>');

async function exercise(browser, machine) {
  const context = await browser.newContext();
  await context.addInitScript(() => {
    localStorage.setItem('rb_session', JSON.stringify({ name: 'QA', role: 'sup', expiresAt: Date.now() + 3600000 }));
  });
  await context.route(/firebaseio\.com/, route => route.abort('blockedbyclient'));
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${url}${url.includes('?') ? '&' : '?'}dashboardSmoke=${Date.now()}-${machine}`, { waitUntil: 'commit', timeout: 60000 });
  await page.waitForSelector('#sidebar', { timeout: 90000 });
  await page.waitForTimeout(1800);
  console.log(`${machine}: dashboard ready`);

  const loginHidden = await page.locator('#rb-login-modal').evaluate(element => getComputedStyle(element).display === 'none');
  await page.locator('#sidebar button').filter({ hasText: 'Product brand' }).click({ timeout: 10000 });
  await page.waitForSelector('#tab-brands.active', { timeout: 10000 });
  console.log(`${machine}: Product brand clickable`);
  await page.locator('#sidebar button').filter({ hasText: 'Graphic' }).click({ timeout: 10000 });
  await page.waitForSelector('#tab-team.active', { timeout: 10000 });
  await page.waitForTimeout(400);
  console.log(`${machine}: Graphic clickable`);
  const trackerDeferred = await page.evaluate(() => !document.querySelector('#ct-tbody') && document.querySelector('[data-sub="links"]')?.getAttribute('data-links-deferred') === '1');
  await page.locator('.gsnav-btn').filter({ hasText: 'สั่งงาน' }).click({ timeout: 10000 });
  await page.waitForSelector('[data-sub="order"].gsp-active', { timeout: 10000 });
  console.log(`${machine}: orders clickable`);
  const result = await page.evaluate(({ machine, loginHidden, trackerDeferred, errors }) => ({
    machine,
    loginHidden,
    trackerDeferred,
    orderPageClickable: !!document.querySelector('[data-sub="order"].gsp-active'),
    nodes: document.getElementsByTagName('*').length,
    errors,
  }), { machine, loginHidden, trackerDeferred, errors });
  await context.close();
  return result;
}

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const results = await Promise.all([exercise(browser, 'A'), exercise(browser, 'B')]);
  console.log(JSON.stringify(results, null, 2));
  if (results.some(item => !item.loginHidden || !item.trackerDeferred || !item.orderPageClickable || item.nodes > 4000 || item.errors.length)) process.exitCode = 1;
  await browser.close();
})().catch(error => { console.error(error.stack || error.message); process.exitCode = 1; });
