const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const url = process.argv[2] || 'file:///C:/Users/adsri/OneDrive/%E0%B9%80%E0%B8%AD%E0%B8%81%E0%B8%AA%E0%B8%B2%E0%B8%A3/ChatGPT/%E0%B8%88%E0%B8%B1%E0%B8%94%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%87%E0%B8%B2%E0%B8%99%E0%B8%97%E0%B8%B5%E0%B8%A1%20Graphic/index.html?qa=fix311';
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const cloud = { d: {}, u: 1, t: 1, updatedBy: '' };

  async function installRoutes(context) {
    await context.route(/^https?:\/\/(?!127\.0\.0\.1(?::\d+)?\/)/, route => route.abort('blockedbyclient'));
    await context.route(/firebaseio\.com/, async route => {
      const request = route.request();
      const parsed = new URL(request.url());
      const path = decodeURIComponent(parsed.pathname.replace(/\.json$/, ''));
      const method = request.method();
      if (method === 'GET') {
        const body = path === '/lv_data' ? cloud : null;
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
      }
      if (method === 'PUT') {
        const value = JSON.parse(request.postData() || 'null');
        const parts = path.split('/').filter(Boolean);
        if (parts[0] === 'lv_data' && parts[1] === 'd' && parts[2]) {
          const date = parts[2], storageKey = parts[3];
          if (!cloud.d[date] || Array.isArray(cloud.d[date])) {
            const previous = cloud.d[date] || [];
            cloud.d[date] = {};
            previous.forEach((entry, index) => { if (entry) cloud.d[date][String(index)] = entry; });
          }
          if (value === null) delete cloud.d[date][storageKey];
          else cloud.d[date][storageKey] = value;
          if (!Object.keys(cloud.d[date]).length) delete cloud.d[date];
        } else if (parts[0] === 'lv_data' && parts[1]) cloud[parts[1]] = value;
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(value) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
    });
    await context.route(/docs\.google\.com\/spreadsheets/, route => route.fulfill({ status: 200, contentType: 'text/csv; charset=utf-8', body: '' }));
  }

  async function openFor(name) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.addInitScript(user => {
      localStorage.setItem('rb_session', JSON.stringify({ name: user, role: 'ga', expiresAt: Date.now() + 3600000 }));
    }, name);
    await installRoutes(context);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url, { waitUntil: 'commit', timeout: 60000 });
    await page.waitForSelector('#sidebar', { timeout: 90000 });
    if (!await page.evaluate(() => !!window._lvwTest)) await page.addScriptTag({ path: 'snippets/leave-workforce-v1.js' });
    if (!await page.evaluate(() => document.documentElement.getAttribute('data-leave-persistence') === '3.1.0')) await page.addScriptTag({ path: 'snippets/leave-persistence-v2.js' });
    await page.evaluate(() => { if (window._lvwTest && window._lvwTest.init) window._lvwTest.init(); });
    const leaveButton = page.locator('#sidebar button').filter({ hasText: 'ตารางวันหยุด' });
    await leaveButton.click();
    await page.waitForSelector('#tab-schedule.active');
    await page.waitForFunction(() => document.documentElement.getAttribute('data-lvw-version') === '1.8.0', null, { timeout: 90000 }).catch(async error => {
      const state = await page.evaluate(() => ({ lvw: !!window._lvwTest, render: typeof window.lvRenderCal, schedule: !!document.getElementById('tab-schedule') }));
      throw new Error(`${error.message}; state=${JSON.stringify(state)}; pageErrors=${errors.join(' | ')}`);
    });
    await page.waitForFunction(() => document.documentElement.getAttribute('data-leave-persistence') === '3.1.0', null, { timeout: 90000 });
    await page.waitForSelector('#lv-cal-body .lv-day[data-lvw-date]');
    await page.waitForSelector('.lvw-open-today');
    await page.locator('.lvw-open-today').click();
    await page.waitForSelector('#lv-modal.open #lvw-cl-start');
    const today = await page.evaluate(() => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; });
    assert.equal(await page.locator('#lvw-cl-start').inputValue(),today,'the today shortcut must open today ready for add or edit');
    await page.locator('#lv-modal .lv-mclose').click();
    await page.locator('#lv-modal').waitFor({ state: 'hidden' });
    return { context, page, errors };
  }

  async function addLeave(session, employeeId, type, note, dayIndex) {
    const day = session.page.locator('#lv-cal-body .lv-day:not(.lv-day-other)').nth(dayIndex);
    await day.click();
    await session.page.waitForSelector('#lv-modal.open #lvw-cl-start');
    const dateValue = await session.page.locator('#lvw-cl-start').inputValue();
    assert.equal(await session.page.locator('#lv-f-emp').inputValue(), employeeId, 'employee must be limited to their own leave record');
    await session.page.locator('#lv-f-type').selectOption(type);
    await session.page.locator('#lv-f-note').fill(note);
    await session.page.locator('#lv-f-save').click();
    await session.page.locator('.lvw-persist-feedback.is-saved').waitFor({ state: 'visible' });
    await session.page.locator('#lv-modal').waitFor({ state: 'hidden' });
    await session.page.waitForFunction(() => !localStorage.getItem('rb_leave_pending_v2'), null, { timeout: 15000 });
    return dateValue;
  }

  async function editLeave(session, note, dayIndex) {
    const day = session.page.locator('#lv-cal-body .lv-day:not(.lv-day-other)').nth(dayIndex);
    await day.click();
    await session.page.waitForSelector('#lv-modal.open #lv-elist .lv-erow');
    await session.page.locator('#lv-elist .lv-enote').fill(note);
    await session.page.locator('#lv-elist .lv-esave').click();
    await session.page.locator('.lvw-persist-feedback.is-saved').waitFor({ state: 'visible' });
    await session.page.locator('#lv-modal').waitFor({ state: 'hidden' });
    await session.page.waitForFunction(() => !localStorage.getItem('rb_leave_pending_v2'), null, { timeout: 15000 });
  }

  const dom = await openFor('Dom');
  const date = await addLeave(dom, 'dom', 'vac', 'ทดสอบบันทึกหลังรีเฟรช', 14);
  const [year, month, day] = date.split('-').map(Number);
  const storageDate = `${year}-${month}-${day}`;
  assert.equal(Object.values(cloud.d[storageDate]).some(entry => entry.empId === 'dom'), true, 'Dom leave must reach the cloud store');
  await editLeave(dom, 'แก้ไขแล้วและต้องคงอยู่', 14);
  assert.equal(Object.values(cloud.d[storageDate]).find(entry => entry.empId === 'dom').note, 'แก้ไขแล้วและต้องคงอยู่', 'an employee edit must reach the cloud store');
  await dom.page.evaluate(() => { window.lvNextMonth(); window.lvPrevMonth(); });
  assert.equal(await dom.page.evaluate(({ year, month, day }) => window.lvGetDay(year, month, day).some(entry => entry.empId === 'dom'), { year, month, day }), true, 'the saved leave must survive month navigation');

  const jam = await openFor('Jam');
  await addLeave(jam, 'jam', 'sick', 'ทดสอบหลายผู้ใช้', 14);
  assert.deepEqual(Object.values(cloud.d[storageDate]).map(entry => entry.empId).sort(), ['dom', 'jam'], 'concurrent employees must not overwrite each other');

  await dom.page.reload({ waitUntil: 'commit' });
  await dom.page.waitForSelector('#sidebar', { timeout: 90000 });
  if (!await dom.page.evaluate(() => !!window._lvwTest)) await dom.page.addScriptTag({ path: 'snippets/leave-workforce-v1.js' });
  if (!await dom.page.evaluate(() => document.documentElement.getAttribute('data-leave-persistence') === '3.1.0')) await dom.page.addScriptTag({ path: 'snippets/leave-persistence-v2.js' });
  await dom.page.evaluate(() => { if (window._lvwTest && window._lvwTest.init) window._lvwTest.init(); });
  await dom.page.locator('#sidebar button').filter({ hasText: 'ตารางวันหยุด' }).click();
  await dom.page.waitForFunction(() => document.documentElement.getAttribute('data-leave-persistence') === '3.1.0', null, { timeout: 90000 });
  await dom.page.waitForFunction(({ year, month, day }) => typeof window.lvGetDay === 'function' && window.lvGetDay(year, month, day).length === 2, { year, month, day }, { timeout: 30000 });
  const restored = await dom.page.evaluate(({ year, month, day }) => window.lvGetDay(year, month, day).map(entry => ({ empId: entry.empId, type: entry.type, note: entry.note })), { year, month, day });
  assert.deepEqual(restored.map(entry => entry.empId).sort(), ['dom', 'jam'], 'both employees must remain after reload');
  assert.equal(restored.find(entry => entry.empId === 'dom').note, 'แก้ไขแล้วและต้องคงอยู่');
  assert.equal(dom.errors.length, 0, `Dom page errors: ${dom.errors.join(' | ')}`);
  assert.equal(jam.errors.length, 0, `Jam page errors: ${jam.errors.join(' | ')}`);

  await dom.context.close();
  await jam.context.close();
  await browser.close();
  console.log('leave persistence user e2e: add, edit, month navigation, concurrent users and reload passed');
})().catch(error => { console.error(error.stack || error.message); process.exitCode = 1; });
