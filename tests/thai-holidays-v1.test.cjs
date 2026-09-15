const assert=require('node:assert/strict'),fs=require('fs'),{JSDOM}=require('jsdom');
const dom=new JSDOM('<div class="lv-cal"><div id="lv-cal-body"></div></div>',{url:'https://example.test',runScripts:'outside-only'}),w=dom.window;
w.LV_CUR={y:2026,m:4};
function cells(n){w.document.querySelector('#lv-cal-body').innerHTML='<div class="lv-day lv-day-other"></div>'+Array.from({length:n},(_,i)=>`<div class="lv-day" onclick="void 0"><div class="lv-day-num">${i+1}</div><div class="lv-chips"><span>Jam</span></div></div>`).join('');}
cells(30);w.eval(fs.readFileSync('snippets/thai-holiday-calendar-v1.js','utf8'));w.eval(fs.readFileSync('snippets/thai-holidays-v1.js','utf8'));const api=w.rbThaiHolidays;api.render();
assert.equal(w.document.querySelectorAll('.lv-holiday-mark').length,4);assert.equal(w.document.querySelector('.lv-day-other .lv-holiday-mark'),null);
assert.equal(api.get(2026,5,13).name,'วันพืชมงคล');assert.equal(api.get(2026,5,11),null);
assert.equal(api.get(2026,5,1),null);assert.equal(api.get(2026,6,2),null);assert.equal(api.get(2026,7,31),null);
assert.equal(api.get(2026,10,16).scope,'bangkok');assert.match(api.get(2026,10,16).name,/เฉพาะกรุงเทพ/);
assert.equal(api.get(2026,6,1).name,'ชดเชยวันวิสาขบูชา');assert.equal(api.get(2027,4,13).name,'วันสงกรานต์');assert.equal(api.get(2027,1,2),null,'one-off 2026 holidays must not recur');
assert.match(api.get(2023,6,3).name,/พระราชินี[\s\S]*วันวิสาขบูชา/,'two events on one date must both be visible');
api.render();assert.equal(w.document.querySelectorAll('.lv-holiday-mark').length,4,'rerender must not duplicate');
assert.equal(w.document.querySelectorAll('.lv-chips span').length,30,'staff preserved');
const checkbox=w.document.querySelector('#lv-holiday-toggle');checkbox.checked=false;checkbox.dispatchEvent(new w.Event('change'));assert.equal(w.document.querySelectorAll('.lv-holiday-mark').length,0);assert.equal(w.localStorage.getItem('rb_show_thai_holidays_v1'),'0');
Object.defineProperty(w.Storage.prototype,'setItem',{value(){throw Error('QuotaExceeded')}});checkbox.checked=true;checkbox.dispatchEvent(new w.Event('change'));assert.equal(w.document.querySelectorAll('.lv-holiday-mark').length,4,'storage failure cannot block display');
w.LV_CUR={y:2026,m:9};cells(30);api.render();assert.equal(w.document.querySelectorAll('.lv-holiday-mark').length,0);
w.LV_CUR={y:2027,m:4};api.render();assert.match(w.document.querySelector('#lv-holiday-note').textContent,/2570.*คำนวณ/);assert.equal(w.document.querySelectorAll('.lv-holiday-mark').length,4);
const input=w.document.querySelector('#lv-holiday-year');input.value='2571';input.dispatchEvent(new w.Event('change'));assert.equal(w.LV_CUR.y,2028);assert.equal(w.document.querySelectorAll('.lv-holiday-mark').length,5,'2028 Chakri and Songkran plus substitute');input.value='';input.dispatchEvent(new w.Event('change'));assert.equal(w.LV_CUR.y,2028,'invalid year must preserve calendar');
dom.window.close();console.log('PASS verified dates, scope, year coverage, staff preservation, toggle/quota, rerender');
