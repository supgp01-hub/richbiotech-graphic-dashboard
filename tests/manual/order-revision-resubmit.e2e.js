const {chromium}=require('playwright');
const assert=require('assert');
const {installSecureAuthMock}=require('./secure-auth-mock');

(async()=>{
  const target=process.argv[2]||'http://127.0.0.1:8014/';
  const order={
    id:'GR902',_fbKey:'qa_revision_order',name:'Revision link test',product:'WOLF+',type:'กราฟิก',
    deadline:'2026-08-25',status:'revision',assignee:'DOM',
    rawLink:'https://drive.google.com/creative',sheetLink:'https://docs.google.com/script',
    footageLink:'https://drive.google.com/footage',reviewLink:'https://drive.google.com/review',
    brief:'Original brief must remain visible',hook:'HOOK-A',hook2:'HOOK-B',camp1:'Revision link test',
    submitLinks:['https://drive.google.com/original-submit'],createdAt:Date.now(),updatedAt:Date.now(),
    auditVersions:[{version:1,name:'Revision link test',result:'issue',issueType:'อื่นๆ',note:'แก้ข้อความตามรูปตัวอย่าง',workLink:'https://drive.google.com/original-submit',imageLink:'',auditImages:[{data:'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI0OCI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjZmVlMmUyIi8+PHRleHQgeD0iOCIgeT0iMjgiIGZpbGw9IiNiOTFlMWUiPkFVRElUPC90ZXh0Pjwvc3ZnPg==',name:'audit-example.svg',by:'Audit',at:Date.now()}],fixImages:[],employeeSubmittedAt:0,correctionRequestedAt:Date.now(),updatedAt:Date.now()}]
  };
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  const context=await browser.newContext({serviceWorkers:'block'});
  await installSecureAuthMock(context,{role:'graphic',name:'Dom',orders:[order]});
  await context.addInitScript(order=>{
    localStorage.setItem('rb_orders_v1',JSON.stringify([order]));
    localStorage.setItem('rb_theme','dark');
  },order);
  const page=await context.newPage();
  const errors=[];
  const revisionResources=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.url().includes('order-revision-experience'))revisionResources.push({url:response.url(),status:response.status()});});
  page.on('requestfailed',request=>{if(request.url().includes('order-revision-experience'))revisionResources.push({url:request.url(),failed:request.failure()});});
  await page.goto(target,{waitUntil:'commit',timeout:60000});
  await page.waitForSelector('#sidebar',{timeout:90000});
  await page.waitForFunction(()=>typeof window.openOM==='function'&&typeof window._rbInitOP==='function',null,{timeout:90000});
  await page.waitForFunction(()=>typeof window.rbOpenEvidenceLightbox==='function'&&typeof window.rbRefreshOrderNotifications==='function',null,{timeout:90000});
  const revisionRuntime=await page.evaluate(()=>({destination:typeof window.rbOpenOrderDestination,lightbox:typeof window.rbOpenEvidenceLightbox,notifications:typeof window.rbRefreshOrderNotifications}));
  assert.deepStrictEqual(revisionRuntime,{destination:'function',lightbox:'function',notifications:'function'},'revision routing, notifications, and large preview must load: '+JSON.stringify(revisionResources));
  await page.evaluate(order=>{
    window._rbUser={role:'graphic',name:'Dom'};
    localStorage.setItem('rb_session',JSON.stringify({name:'Dom',role:'graphic',expiresAt:Date.now()+3600000}));
    localStorage.setItem('rb_orders_v1',JSON.stringify([order]));
    document.getElementById('rb-login-modal')?.remove();
    if(window._rbInitOP)window._rbInitOP();
  },order);

  await page.evaluate(()=>{window.rbRefreshOrderNotifications();window._rbTogNotif();});
  const revisionNotice=page.locator('.rbn-item-button').filter({hasText:'GR902'}).first();
  await revisionNotice.waitFor({state:'visible'});
  assert.match(await revisionNotice.innerText(),/VER 1/,'revision notification must identify the exact version');
  await revisionNotice.click();
  await page.waitForSelector('#rb-order-modal[data-active-tab="imgs"]',{state:'visible'});
  await page.waitForSelector('#rb-team-version-workflow .rb-av-card[data-version-index="0"]',{state:'visible'});
  assert.strictEqual(await page.locator('.rb-av-upload.is-fix').first().isVisible(),true,'Graphic users must receive a per-version corrected-image upload');
  await page.locator('#rb-team-version-workflow .rb-av-audit-gallery img').first().click();
  await page.waitForSelector('#rb-evidence-lightbox:not([hidden])',{state:'visible'});
  assert.match(await page.locator('#rb-evidence-lightbox .rb-el-job').innerText(),/GR902 · VER 1/,'large preview must retain job and version context');
  await page.locator('#rb-evidence-lightbox .rb-el-close').click();
  await page.locator('#rb-order-modal .rb-om-header-close').click();
  await page.locator('#sidebar button').filter({hasText:'Graphic'}).click();
  await page.locator('.gsnav-btn').filter({hasText:'สั่งงาน'}).click();
  await page.waitForSelector('[data-sub="order"].gsp-active');
  await page.getByRole('button',{name:'แก้ไขงาน'}).first().click();
  await page.waitForSelector('#rb-order-modal',{state:'visible'});

  const submitInput=page.locator('#om-submitlink');
  assert.strictEqual(await submitInput.isDisabled(),false,'revision submit-link input must be editable for Graphic users');
  assert.strictEqual(await page.locator('#om-add-submitlink').isDisabled(),false,'add-link control must stay enabled during revision');
  assert.strictEqual(await page.locator('#rb-order-modal').getAttribute('class').then(v=>v.includes('rb-revision-detail-mode')),true,'revision jobs must use the dedicated full-detail layout');
  assert.strictEqual(await page.locator('.rb-revision-alert').isVisible(),true,'revision warning must be visible at the top of the detail page');
  assert.strictEqual(await page.locator('#rb-revision-detail-view').getByText('Original brief must remain visible').isVisible(),true,'the original brief must stay visible');
  assert.strictEqual(await page.locator('#rb-revision-detail-view').getByText(/HOOK-A/).isVisible(),true,'saved hooks must stay visible');
  assert.ok(await page.locator('#rb-revision-detail-view a[data-link-btn="1"]').count()>=6,'all existing reference URLs must remain openable');

  const openButtons=page.locator('[data-link-btn="1"]');
  assert.ok(await openButtons.count()>=5,'reference links must expose open/copy actions');
  for(let i=0;i<await openButtons.count();i++)assert.strictEqual(await openButtons.nth(i).isDisabled(),false,'reference link actions must remain enabled in view mode');

  const primary=page.locator('#om-primary-btn');
  assert.strictEqual(await page.locator('#om-resend-btn').count(),0,'legacy duplicate resubmit button must not exist');
  assert.match(await primary.innerText(),/ส่งตรวจอีกครั้ง/,'revision uses the resubmit action');
  const layout=await primary.evaluate(el=>{const s=getComputedStyle(el);return{display:s.display,align:s.alignItems,justify:s.justifyContent};});
  assert.ok(layout.display==='flex'||layout.display==='inline-flex');
  assert.strictEqual(layout.align,'center');
  assert.strictEqual(layout.justify,'center');

  await page.getByRole('tab',{name:'ส่งงานภาพ',exact:true}).click();
  assert.match(await primary.innerText(),/ส่งตรวจอีกครั้ง/,'image tab must expose the real revision-submit action');
  assert.strictEqual(await page.locator('#om-audit-btns').isVisible(),false,'audit actions must stay hidden on image tab');
  assert.strictEqual(await page.locator('.rb-om-footer button:visible').count(),1,'image tab must not show duplicate footer actions');
  await page.getByRole('tab',{name:'ตรวจออดิต'}).click();
  assert.strictEqual(await primary.isVisible(),false,'Graphic users must not receive a primary action on audit tab');
  assert.strictEqual(await page.locator('#om-audit-btns').isVisible(),false,'Graphic users must not receive audit decisions');
  await page.getByRole('tab',{name:'ประเภทงาน'}).click();
  assert.match(await primary.innerText(),/ส่งตรวจอีกครั้ง/,'returning to info tab must restore the revision action');
  assert.strictEqual(await page.locator('.rb-om-footer button:visible').count(),1,'revision info tab must show exactly one footer action');

  await submitInput.fill('https://drive.google.com/new-revision');
  await page.locator('#om-revision-note').fill('แก้ไขตามหมายเหตุครบแล้ว');
  await page.getByRole('tab',{name:'ส่งงานภาพ',exact:true}).click();
  assert.match(await primary.innerText(),/ส่งตรวจอีกครั้ง/,'image tab must submit the revision instead of only saving it');
  await primary.click();
  await page.waitForTimeout(300);
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('rb_orders_v1'))[0]);
  assert.strictEqual(saved.status,'review','resubmission must return the job to review');
  assert.deepStrictEqual(saved.submitLinks,['https://drive.google.com/original-submit'],'original submit links must never be overwritten by a revision');
  assert.strictEqual(saved.revisionSubmissions.length,1,'a revision must be appended to revision history');
  assert.deepStrictEqual(saved.revisionSubmissions[0].links,['https://drive.google.com/new-revision']);
  assert.strictEqual(saved.revisionSubmissions[0].note,'แก้ไขตามหมายเหตุครบแล้ว');
  assert.deepStrictEqual(errors,[],'no JavaScript errors are allowed');
  await browser.close();
  console.log('order revision resubmit: all tests passed');
})().catch(error=>{console.error(error);process.exit(1);});
