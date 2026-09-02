const assert=require('assert');
const path=require('path');
const modules=process.env.CODEX_PRIMARY_NODE_MODULES;
if(!modules)throw new Error('CODEX_PRIMARY_NODE_MODULES is required');
const {chromium}=require(path.join(modules,'playwright'));

(async()=>{
  const target=process.argv[2]||'http://127.0.0.1:8765/index.html?v=fix325';
  const targetOrigin=new URL(target).origin;
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  await context.addInitScript(()=>{
    localStorage.setItem('rb_session',JSON.stringify({name:'View',role:'sup',expiresAt:Date.now()+3600000}));
    localStorage.setItem('rb_theme','light');
    if(!sessionStorage.getItem('lvw_e2e_seeded')){
      localStorage.removeItem('lv_dash_v5');
      localStorage.removeItem('rb_leave_persistence_v2');
      localStorage.removeItem('rb_specialwork_v1');
      sessionStorage.setItem('lvw_e2e_seeded','1');
    }
  });
  await context.route(/^https?:\/\//,route=>new URL(route.request().url()).origin===targetOrigin?route.continue():route.abort('blockedbyclient'));
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(target,{waitUntil:'commit',timeout:60000});
  await page.waitForSelector('#sidebar',{timeout:90000});
  if(!await page.evaluate(()=>!!window._lvwTest)){
    await page.addStyleTag({path:'snippets/leave-workforce-v1.css'});
    await page.addStyleTag({path:'snippets/leave-day-actions-v2.css'});
    await page.addScriptTag({path:'snippets/leave-persistence-v2.js'});
    await page.addScriptTag({path:'snippets/specialwork-persistence-v2.js'});
    await page.addScriptTag({path:'snippets/leave-workforce-v1.js'});
    await page.addScriptTag({path:'snippets/leave-day-actions-v2.js'});
  }
  await page.waitForFunction(()=>!!window._lvwTest,null,{timeout:90000});
  await page.evaluate(()=>{document.querySelectorAll('.tab-panel').forEach(x=>x.classList.remove('active'));document.getElementById('tab-schedule').classList.add('active')});
  await page.evaluate(()=>window._lvwTest.init());
  await page.waitForSelector('#tab-schedule.active #lvw-multi-btn');
  await page.click('#lvw-multi-btn');
  await page.waitForSelector('#lv-modal.open .lvw-combined-box[data-lvw-mode="special"]');
  assert.strictEqual(await page.locator('.lvw-combined-tabs button').count(),3);
  assert.strictEqual(await page.locator('[data-combined-nav="calendar"]').count(),0);
  assert.ok(!(await page.locator('.lvw-combined-tools').innerText()).includes('ว่างรับงาน:'));
  assert.strictEqual(await page.locator('#lvw-combined-special [data-special-type]').count(),4);
  assert.strictEqual(await page.locator('#lvw-combined-special .lvw-special-workspace').count(),1);
  assert.strictEqual(await page.locator('#lvw-combined-special .lvw-entry-form').count(),1);
  assert.strictEqual(await page.locator('#tab-schedule .lv-job-badge').count(),0);
  if(process.env.CODEX_UI_CAPTURE)await page.locator('#lv-modal .lvw-combined-box').screenshot({path:process.env.CODEX_UI_CAPTURE});

  await page.evaluate(()=>{window.fbSet=function(){return new Promise(function(){})}});
  await page.selectOption('#lvw-cs-emp','wiw');
  await page.click('#lvw-combined-special [data-special-type="training"]');
  await page.fill('#lvw-cs-start','2026-09-23');
  await page.fill('#lvw-cs-end','2026-09-23');
  await page.fill('#lvw-cs-time-start','09:00');
  await page.fill('#lvw-cs-time-end','17:30');
  await page.fill('#lvw-cs-note','E2E special persistence');
  await page.click('#lvw-cs-save');
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('rb_specialwork_v1')||'[]').some(x=>x.note==='E2E special persistence'));
  assert.strictEqual(await page.locator('#lvw-cs-save').isDisabled(),false,'special-work save must stay usable while cloud sync is pending');
  assert.strictEqual(await page.locator('[data-combined-mode="leave"]').isDisabled(),false,'navigation must stay usable after special-work save');
  await page.fill('#lvw-cs-start','2026-09-22');
  await page.fill('#lvw-cs-end','2026-09-22');
  await page.fill('#lvw-cs-note','E2E second special without refresh');
  await page.click('#lvw-cs-save');
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('rb_specialwork_v1')||'[]').some(x=>x.note==='E2E second special without refresh'));

  await page.click('[data-combined-mode="leave"]');
  await page.waitForSelector('#lvw-combined-leave .lvw-entry-workspace');
  assert.strictEqual(await page.locator('#lvw-combined-leave [data-leave-type]').count(),4);
  if(process.env.CODEX_UI_CAPTURE)await page.locator('#lv-modal .lvw-combined-box').screenshot({path:process.env.CODEX_UI_CAPTURE.replace(/\.png$/,'-leave.png')});
  await page.selectOption('#lv-f-emp','wiw');
  await page.click('#lvw-combined-leave [data-leave-type="hol"]');
  await page.fill('#lvw-cl-start','2026-09-24');
  await page.fill('#lvw-cl-end','2026-09-24');
  await page.fill('#lv-f-note','E2E leave persistence');
  await page.evaluate(()=>{if(window.rbLeavePersistence)window.rbLeavePersistence.waitForSync=function(){return new Promise(function(){})}});
  await page.click('#lv-f-save');
  assert.strictEqual(await page.locator('#lv-f-save').isDisabled(),false,'leave save must stay usable while cloud sync is pending');
  await page.click('[data-combined-mode="report"]');
  await page.waitForSelector('#lvw-combined-report .lvw-report-workspace');
  assert.strictEqual(await page.locator('[data-report-kind]').count(),2);
  assert.strictEqual(await page.locator('.lvw-team-day').count(),0);
  assert.ok((await page.locator('#lvw-combined-report').innerText()).includes('ประวัติวันหยุดปกติ'));
  if(process.env.CODEX_UI_CAPTURE)await page.locator('#lv-modal .lvw-combined-box').screenshot({path:process.env.CODEX_UI_CAPTURE.replace(/\.png$/,'-report.png')});
  await page.waitForFunction(()=>{
    const raw=localStorage.getItem('lv_dash_v5');if(!raw)return false;
    const data=JSON.parse(raw).d||{};
    return Object.values(data).flat().some(x=>x.note==='E2E leave persistence');
  });

  await page.reload({waitUntil:'commit'});
  await page.waitForSelector('#sidebar',{timeout:90000});
  if(!await page.evaluate(()=>!!window._lvwTest)){
    await page.addStyleTag({path:'snippets/leave-workforce-v1.css'});
    await page.addScriptTag({path:'snippets/leave-persistence-v2.js'});
    await page.addScriptTag({path:'snippets/specialwork-persistence-v2.js'});
    await page.addScriptTag({path:'snippets/leave-workforce-v1.js'});
  }
  await page.waitForFunction(()=>!!window._lvwTest);
  await page.evaluate(()=>window._lvwTest.init());
  const persisted=await page.evaluate(()=>({
    leave:Object.values((JSON.parse(localStorage.getItem('lv_dash_v5')||'{"d":{}}').d)||{}).flat().some(x=>x.note==='E2E leave persistence'),
    special:JSON.parse(localStorage.getItem('rb_specialwork_v1')||'[]').some(x=>x.note==='E2E special persistence'),
    version:document.documentElement.getAttribute('data-lvw-version')
  }));
  assert.deepStrictEqual(persisted,{leave:true,special:true,version:'2.4.0'});
  assert.deepStrictEqual(errors,[],errors.join(' | '));

  const workerContext=await browser.newContext({viewport:{width:1280,height:900}});
  await workerContext.addInitScript(()=>{
    localStorage.setItem('rb_session',JSON.stringify({name:'Ter',role:'graphic',expiresAt:Date.now()+3600000}));
    localStorage.setItem('lv_dash_v5',JSON.stringify({u:3,d:{'2026-9-24':[{uid:1,empId:'ter',type:'hol',note:'ของเตอร์'},{uid:2,empId:'nun',type:'vac',note:'ของนุ่น'}]}}));
    localStorage.setItem('rb_specialwork_v1',JSON.stringify([{id:'own',empId:'ter',cat:'wfh',dates:['2026-9-23']},{id:'other',empId:'nun',cat:'training',dates:['2026-9-23']}]))
  });
  await workerContext.route(/^https?:\/\//,route=>new URL(route.request().url()).origin===targetOrigin?route.continue():route.abort('blockedbyclient'));
  const worker=await workerContext.newPage();
  await worker.goto(target,{waitUntil:'commit',timeout:60000});
  await worker.waitForSelector('#sidebar',{timeout:90000});
  await worker.addStyleTag({path:'snippets/leave-workforce-v1.css'});
  await worker.addScriptTag({path:'snippets/leave-persistence-v2.js'});
  await worker.addScriptTag({path:'snippets/specialwork-persistence-v2.js'});
  await worker.addScriptTag({path:'snippets/leave-workforce-v1.js'});
  await worker.waitForFunction(()=>!!window._lvwTest);
  await worker.evaluate(()=>{document.querySelectorAll('.tab-panel').forEach(x=>x.classList.remove('active'));document.getElementById('tab-schedule').classList.add('active');window._lvwTest.init();document.getElementById('lvw-multi-btn').click()});
  await worker.waitForSelector('#lv-modal.open [data-lvw-mode="special"]');
  assert.deepStrictEqual(await worker.locator('#lvw-cs-emp option').evaluateAll(opts=>opts.map(x=>x.value).filter(Boolean)),['ter']);
  assert.ok((await worker.locator('#lvw-combined-special .lvw-my-record-list').innerText()).includes('Ter'));
  assert.ok(!(await worker.locator('#lvw-combined-special .lvw-my-record-list').innerText()).includes('Nune'));
  await worker.click('[data-combined-mode="leave"]');
  assert.deepStrictEqual(await worker.locator('#lv-f-emp option').evaluateAll(opts=>opts.map(x=>x.value).filter(Boolean)),['ter']);
  assert.ok((await worker.locator('#lvw-combined-leave .lvw-my-record-list').innerText()).includes('Ter'));
  assert.ok(!(await worker.locator('#lvw-combined-leave .lvw-my-record-list').innerText()).includes('Nune'));
  await worker.click('[data-combined-mode="report"]');
  assert.ok((await worker.locator('#lvw-combined-report').innerText()).includes('Nune'));
  await worker.click('[data-report-kind="special"]');
  assert.ok((await worker.locator('#lvw-combined-report').innerText()).includes('Nune'));
  assert.strictEqual(await worker.locator('#lvw-combined-report [data-report-delete*="other"]').count(),0);
  await workerContext.close();
  console.log('leave and special-work workspaces persisted across refresh');
  await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
