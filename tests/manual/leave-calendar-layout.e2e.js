const {chromium}=require('playwright');
const assert=require('assert');

(async()=>{
  const targetUrl=process.argv[2]||'http://127.0.0.1:8024/index.html?v=262';
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  const context=await browser.newContext({viewport:{width:1440,height:1050}});
  await context.addInitScript(()=>{
    localStorage.setItem('rb_session',JSON.stringify({name:'View',role:'sup',expiresAt:Date.now()+3600000}));
    localStorage.setItem('rb_theme','light');
    const now=new Date(),y=now.getFullYear(),m=now.getMonth()+1;
    const key=d=>`${y}-${m}-${d}`;
    localStorage.setItem('lv_dash_v5',JSON.stringify({u:10,d:{
      [key(16)]:[{uid:1,empId:'nun',type:'hol'},{uid:2,empId:'ter',type:'hol'},{uid:3,empId:'dom',type:'hol'}],
      [key(22)]:[{uid:4,empId:'mos',type:'vac'},{uid:5,empId:'jam',type:'vac'}]
    }}));
    localStorage.setItem('rb_specialwork_v1',JSON.stringify([
      {id:'sw1',empId:'wiw',cat:'wfh',dates:[key(26)]},
      {id:'sw2',empId:'ter',cat:'office',dates:[key(27)]},
      {id:'sw3',empId:'nui',cat:'training',dates:[key(28)]},
      {id:'sw4',empId:'wiw',cat:'outing',dates:[key(29)]}
    ]));
  });
  await context.route(/firebaseio\.com/,route=>route.abort('blockedbyclient'));
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(targetUrl,{waitUntil:'commit',timeout:60000});
  await page.waitForSelector('#sidebar',{timeout:90000});
  await page.locator('#sidebar button').filter({hasText:'ตารางวันหยุด'}).click();
  await page.waitForSelector('#tab-schedule.active .lv-day');
  await page.waitForTimeout(500);

  const result=await page.evaluate(()=>{
    const allowed=['WFH','เข้าออฟฟิศ','อบรม','OUTING'];
    const employeeNames=['View','Moss','Dom','Ter','Nune','Jam','Ball','Nui','Mind'];
    const days=[...document.querySelectorAll('#tab-schedule .lv-day')];
    const failures=[];
    let threePersonDays=0;
    days.forEach((day,index)=>{
      const dr=day.getBoundingClientRect();
      const num=day.querySelector('.lv-day-num');
      const ribbons=day.querySelector('.lvw-special-ribbons');
      const chips=[...day.querySelectorAll('.lv-emp-chip:not(.lv-special-chip)')];
      if(ribbons&&num&&!(ribbons.compareDocumentPosition(num)&Node.DOCUMENT_POSITION_FOLLOWING)) failures.push(`day ${index+1}: activity bar is not above date`);
      [...day.querySelectorAll('.lvw-special-ribbon')].forEach(ribbon=>{
        const text=ribbon.textContent.trim();
        if(!allowed.some(label=>text.includes(label))) failures.push(`day ${index+1}: unexpected activity label ${text}`);
        if(employeeNames.some(name=>text.includes(name))) failures.push(`day ${index+1}: employee leaked into activity label ${text}`);
      });
      chips.forEach(chip=>{
        const cr=chip.getBoundingClientRect();
        const name=chip.querySelector('.lv-emp-name');
        if(cr.left<dr.left-1||cr.right>dr.right+1||cr.top<dr.top-1||cr.bottom>dr.bottom+1) failures.push(`day ${index+1}: employee chip outside cell`);
        if(name&&name.scrollWidth>name.clientWidth+1) failures.push(`day ${index+1}: employee name clipped: ${name.textContent.trim()}`);
        if(num){const nr=num.getBoundingClientRect();if(cr.top<nr.bottom-1) failures.push(`day ${index+1}: employee overlaps date`);}
      });
      if(chips.length===3){
        threePersonDays++;
        const r=chips.map(ch=>ch.getBoundingClientRect());
        if(Math.abs(r[0].top-r[1].top)>2||r[2].top<=r[0].top+2||Math.abs(r[2].left-r[0].left)>5) failures.push(`day ${index+1}: three-person layout is not 2 + 1 left`);
      }
    });
    return {failures,threePersonDays,ribbonCount:document.querySelectorAll('#tab-schedule .lvw-special-ribbon').length,gridCount:document.querySelectorAll('#tab-schedule .lv-chips-grid2').length,specialStored:localStorage.getItem('rb_specialwork_v1'),moduleVersion:window.__RB_LEAVE_WORKFORCE_VERSION__||''};
  });
  assert.deepStrictEqual(result.failures,[],result.failures.join(' | '));
  assert.ok(result.gridCount>0,'Expected at least one 2–4 person calendar grid');
  assert.ok(result.ribbonCount>0,`Expected at least one special-work activity bar: ${JSON.stringify(result)}`);
  assert.deepStrictEqual(errors,[],`browser errors: ${errors.join(' | ')}`);
  console.log(`leave calendar layout passed: ${result.gridCount} employee grids, ${result.ribbonCount} activity bars, ${result.threePersonDays} three-person days`);
  await browser.close();
})().catch(error=>{console.error(error);process.exit(1);});
