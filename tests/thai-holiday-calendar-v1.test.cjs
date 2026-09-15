const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');const ctx={window:{}};vm.runInNewContext(fs.readFileSync('snippets/thai-holiday-calendar-v1.js','utf8'),ctx);const api=ctx.window.rbThaiHolidayCalendar;
// Official published dates (2567 Gazette, 2568 institutional calendar,
// 2569 ministry announcements); all four lunar holidays and substitutes.
const fixtures={2024:['02-24','05-22','07-20','07-21'],2025:['02-12','05-11','07-10','07-11'],2026:['03-03','05-31','07-29','07-30']};
for(const [y,dates]of Object.entries(fixtures)){const r=api.forYear(+y).filter(x=>x.icon==='lotus'&&!x.substitute);assert.equal(JSON.stringify(r.map(x=>x.date.slice(5))),JSON.stringify(dates));}
for(let y=1900;y<=2200;y++){const r=api.forYear(y),seen=new Set();assert.equal(r.filter(x=>x.icon==='lotus'&&!x.substitute).length,4,`${y} lunar events`);for(const e of r){assert.equal(+e.date.slice(0,4),y);assert.equal(new Date(e.date+'T00:00:00Z').toISOString().slice(0,10),e.date);const key=e.date+'|'+e.name;assert(!seen.has(key),`${y} duplicate event ${key}`);seen.add(key);if(e.substitute)assert(![0,6].includes(new Date(e.date+'T00:00:00Z').getUTCDay()))}}
const find=(y,date)=>api.forYear(y).find(x=>x.date===date);
assert.equal(find(2029,'2029-01-02').name,'ชดเชยวันสิ้นปี','cross-year boundary');
assert.equal(api.forYear(2024).filter(x=>x.substitute&&x.name.includes('สงกรานต์')).length,1,'government substitutes one day for the Songkran block');
assert.equal(find(2027,'2027-07-20').name,'ชดเชยวันอาสาฬหบูชา','must skip Monday Khao Phansa');
assert.equal(find(2027,'2027-02-21').name,'วันมาฆบูชา');assert.equal(find(2028,'2028-02-10').name,'วันมาฆบูชา');
assert.equal(find(2016,'2016-05-05').name,'วันฉัตรมงคล');assert.equal(find(2017,'2017-05-05'),undefined);assert.equal(find(2019,'2019-05-04').name,'วันฉัตรมงคล');
assert.equal(find(2027,'2027-05-13'),undefined,'do not copy Ploughing date');assert.equal(find(2027,'2027-10-16'),undefined,'do not copy Bangkok special holiday');
assert.equal(api.forYear(NaN).length,0);assert.equal(api.forYear(2027.5).length,0);
const first=api.forYear(2027);first[0].name='mutated';assert.notEqual(api.forYear(2027)[0].name,'mutated');
console.log('PASS official lunar fixtures, 301 years, substitutes/collisions/year-boundary, independent cache, no copied special holidays');
