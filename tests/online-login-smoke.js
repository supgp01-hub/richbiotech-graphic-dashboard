const { chromium, devices } = require('playwright');

const url = process.argv[2];
if (!url) throw new Error('Usage: node tests/online-login-smoke.js <url>');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const profiles = [['desktop', {}], ['mobile', devices['iPhone 13']]];
  const results = [];
  for (const [profile, options] of profiles) {
    const context = await browser.newContext(options);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${url}${url.includes('?') ? '&' : '?'}loginSmoke=${Date.now()}-${profile}`, { waitUntil: 'commit', timeout: 60000 });
    await page.waitForSelector('#rb-login-modal', { timeout: 90000 });
    await page.waitForTimeout(1800);
    const result = await page.evaluate(profileName => {
      const modal = document.querySelector('#rb-login-modal');
      const select = document.querySelector('#rb-login-name');
      const pin = document.querySelector('#rb-login-pin');
      const error = document.querySelector('#rb-login-err');
      select.selectedIndex = Math.min(1, select.options.length - 1);
      select.dispatchEvent(new Event('change', { bubbles: true }));
      const pinStyle = getComputedStyle(pin);
      return {
        profile: profileName,
        ready: document.readyState,
        loginVisible: getComputedStyle(modal).display !== 'none',
        userChoices: select.options.length,
        selectedValueCommitted: !!select.value,
        nativeSelector: select.hasAttribute('data-rb-dd-off') && !select.hasAttribute('data-rb-dd-ready'),
        pinInteractive: pinStyle.pointerEvents !== 'none' && pin.getBoundingClientRect().height >= 40,
        pinBoxesVisible: getComputedStyle(document.querySelector('#rb-pin-dots')).display === 'flex',
        numericKeyboard: pin.getAttribute('inputmode') === 'numeric',
        error: error.textContent.trim(),
        nodes: document.getElementsByTagName('*').length,
      };
    }, profile);
    result.errors = errors;
    results.push(result);
    await context.close();
  }
  console.log(JSON.stringify(results, null, 2));
  if (results.some(item => item.ready !== 'complete' || !item.loginVisible || item.userChoices < 2 || !item.selectedValueCommitted || !item.nativeSelector || !item.pinInteractive || !item.pinBoxesVisible || !item.numericKeyboard || item.error || item.errors.length || item.nodes > 2500)) process.exitCode = 1;
  await browser.close();
})().catch(error => { console.error(error.stack || error.message); process.exitCode = 1; });
