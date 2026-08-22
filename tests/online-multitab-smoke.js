const { chromium } = require('playwright');

const url = process.argv[2];
if (!url) throw new Error('Usage: node tests/online-multitab-smoke.js <url>');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext();
  const pages = [];
  const errors = [];

  for (let i = 0; i < 3; i += 1) {
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(`tab${i + 1}: ${error.message}`));
    page.on('console', message => {
      if (message.type() === 'error' && !message.text().includes('Failed to load resource')) {
        errors.push(`tab${i + 1}: ${message.text()}`);
      }
    });
    page.on('response', response => {
      if (response.request().resourceType() === 'script' && response.status() >= 400) {
        errors.push(`tab${i + 1}: script HTTP ${response.status()} ${response.url()}`);
      }
    });
    page.on('requestfailed', request => {
      if (request.resourceType() === 'script') {
        errors.push(`tab${i + 1}: script request failed ${request.url()}`);
      }
    });
    await page.goto(`${url}${url.includes('?') ? '&' : '?'}smoke=${Date.now()}-${i}`, {
      waitUntil: 'commit',
      timeout: 60000,
    });
    await page.waitForSelector('#rb-sync-chip', { timeout: 90000 });
    pages.push(page);
  }

  await pages[0].waitForTimeout(6000);
  const before = [];
  for (const page of pages) {
    before.push(await page.evaluate(() => ({
      ready: document.readyState,
      sync: document.querySelector('#rb-sync-chip')?.textContent?.trim() || '',
      nodes: document.getElementsByTagName('*').length,
      trackerRows: document.querySelectorAll('#ct-tbody tr').length,
      listRows: document.querySelectorAll('#lfb-tbody tr').length,
      loginVisible: getComputedStyle(document.querySelector('#rb-login-modal')).display !== 'none',
    })));
  }

  const leadersBefore = before.filter(item => item.sync === 'ออนไลน์').length;
  if (leadersBefore !== 1) throw new Error(`Expected 1 online leader, got ${leadersBefore}: ${JSON.stringify(before)}`);
  if (before.some(item => item.nodes > 3000)) throw new Error(`Unexpected startup DOM size: ${JSON.stringify(before)}`);
  if (before.some(item => item.trackerRows > 0 || item.listRows > 0)) throw new Error(`Hidden heavy tables rendered eagerly: ${JSON.stringify(before)}`);

  const leaderIndex = before.findIndex(item => item.sync === 'ออนไลน์');
  await pages[leaderIndex].close();
  const remaining = pages.filter((_, index) => index !== leaderIndex);
  await remaining[0].waitForTimeout(6000);
  const after = [];
  for (const page of remaining) {
    after.push(await page.evaluate(() => ({
      sync: document.querySelector('#rb-sync-chip')?.textContent?.trim() || '',
      nodes: document.getElementsByTagName('*').length,
    })));
  }
  const leadersAfter = after.filter(item => item.sync === 'ออนไลน์').length;
  if (leadersAfter !== 1) throw new Error(`Leader failover failed: ${JSON.stringify(after)}`);
  if (errors.length) throw new Error(`Browser errors:\n${errors.join('\n')}`);

  console.log(JSON.stringify({ before, after, errors }, null, 2));
  await browser.close();
})().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
