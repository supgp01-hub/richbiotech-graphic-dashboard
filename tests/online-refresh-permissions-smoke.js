const { chromium } = require('playwright');

const url = process.argv[2];
if (!url) throw new Error('Usage: node tests/online-refresh-permissions-smoke.js <url>');

async function exercise(browser, role) {
  const context = await browser.newContext();
  await context.addInitScript(sessionRole => {
    localStorage.setItem('rb_session', JSON.stringify({ name: `QA-${sessionRole}`, role: sessionRole, expiresAt: Date.now() + 3600000 }));
  }, role);
  let sheetRequests = 0;
  await context.route(/docs\.google\.com\/spreadsheets/, route => {
    sheetRequests++;
    route.fulfill({ status: 200, contentType: 'text/csv; charset=utf-8', body: 'ชื่อเพจ,สินค้า,สถานะ,พนักงาน,Facebook ID\nเพจทดสอบ,Liv CARE,ใช้งาน,MOS,10001' });
  });
  await context.route(/firebaseio\.com/, route => route.abort('blockedbyclient'));
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${url}${url.includes('?') ? '&' : '?'}refreshSmoke=${Date.now()}-${role}`, { waitUntil: 'commit', timeout: 60000 });
  await page.waitForSelector('#sidebar', { timeout: 90000 });
  await page.waitForTimeout(1000);
  await page.locator('#sidebar button').filter({ hasText: 'Graphic' }).click();
  await page.waitForSelector('#tab-team.active');
  await page.waitForTimeout(300);
  const beforeOpen = sheetRequests;
  await page.locator('.gsnav-btn').filter({ hasText: 'Facebook Pages' }).click();
  await page.waitForTimeout(250);
  const pagesButtonVisible = await page.locator('#lfb-upd').isVisible();
  const afterPagesOpen = sheetRequests;
  if (pagesButtonVisible) await page.locator('#lfb-upd').click();
  await page.waitForTimeout(300);
  const afterPagesManual = sheetRequests;
  await page.locator('.gsnav-btn').filter({ hasText: 'List Facebook' }).click();
  await page.locator('#lfb2-upd').waitFor({ state: 'attached', timeout: 30000 });
  await page.waitForTimeout(250);
  const listButtonVisible = await page.locator('#lfb2-upd').isVisible();
  const afterListOpen = sheetRequests;
  const diagnostics = await page.evaluate(() => ({
    actualRole: window._rbUser && window._rbUser.role,
    canRefresh: typeof window.rbCanRefreshHeavy === 'function' ? window.rbCanRefreshHeavy() : 'missing',
    initSource: String(window._initFbList || '').slice(0, 100),
    fetchSource: String(window._lfbFetch || '').slice(0, 100),
    controllerLoaded: !!document.querySelector('script[src*="manual-refresh-v1"]'),
  }));
  await context.close();
  return { role, beforeOpen, afterPagesOpen, afterPagesManual, afterListOpen, pagesButtonVisible, listButtonVisible, diagnostics, errors };
}

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const [supervisor, graphic] = await Promise.all([exercise(browser, 'sup'), exercise(browser, 'graphic')]);
  console.log(JSON.stringify({ supervisor, graphic }, null, 2));
  const ok = supervisor.beforeOpen === 0 && supervisor.afterPagesOpen === 0 && supervisor.afterPagesManual === 1 && supervisor.afterListOpen === 1 && supervisor.pagesButtonVisible && supervisor.listButtonVisible && graphic.beforeOpen === 0 && graphic.afterPagesOpen === 0 && graphic.afterPagesManual === 1 && graphic.afterListOpen === 1 && graphic.pagesButtonVisible && graphic.listButtonVisible && !supervisor.errors.length && !graphic.errors.length;
  if (!ok) process.exitCode = 1;
  await browser.close();
})().catch(error => { console.error(error.stack || error.message); process.exitCode = 1; });
