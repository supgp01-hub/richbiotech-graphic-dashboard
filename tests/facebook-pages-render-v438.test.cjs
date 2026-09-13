const assert=require('node:assert/strict'),fs=require('node:fs');const{JSDOM}=require('jsdom');
const dom=new JSDOM('<div data-sub="fblist"><div><button id="lfb-upd"></button><span id="lfb-ts"></span></div><div id="fbl-root"></div></div>',{url:'https://example.test',runScripts:'outside-only'}),w=dom.window;
const html=fs.readFileSync('index.html','utf8').replace(/\r/g,''),start=html.indexOf('window._renderFbList=function('),end=html.indexOf('\n}\nvar _mFB=',start);
w.rbPageSizeGet=()=>200;w._rbUser={role:'sup',name:'Test'};w.eval(html.slice(start,end));
for(const name of ['facebook-pages-source-v1.js','facebook-pages-inline-editor-v2.js'])w.eval(fs.readFileSync('snippets/'+name,'utf8'));
const pause=()=>new Promise(r=>setTimeout(r,85));
(async()=>{
 w._renderFbList(w.document.getElementById('fbl-root'),require('./facebook-pages-fixture.cjs')(w.rbFacebookPagesSource,process.argv[2]));await pause();assert.equal(w.document.querySelectorAll('#fbl-body tr[data-name]').length,200);
 for(const [owner,count] of Object.entries({MOS:17,NUNE:39,TER:21,BALL:21,DOM:25,LINK:6,JAM:32})){
  w.document.querySelector('.fblob[data-o="'+owner+'"]').click();await pause();assert.equal(w.document.querySelectorAll('#fbl-body tr[data-name]').length,count,owner+' must see every page');
 }
 w.document.querySelector('.fblob[data-o="LINK"]').click();await pause();
 const linkRows=[...w.document.querySelectorAll('#fbl-body tr[data-name]')];const duplicateName=linkRows.find(r=>linkRows.filter(x=>x.dataset.name===r.dataset.name).length===2).dataset.name;const duplicates=linkRows.filter(r=>r.dataset.name===duplicateName);assert.equal(duplicates.length,2);assert.notEqual(duplicates[0].dataset.fbpKey,duplicates[1].dataset.fbpKey);assert.notEqual(duplicates[0].querySelector('.rb-fbp-page-status').textContent,duplicates[1].querySelector('.rb-fbp-page-status').textContent,'same-name pages keep their own status');
 const statuses=duplicates.map(r=>r.querySelector('.rb-fbp-page-status').textContent);let writes=[];w.fbSet=(path,data)=>{writes.push({path,data});return Promise.resolve(true);};duplicates[1].querySelector('.rb-fbp-row-edit').click();duplicates[1].querySelector('[data-creator]').value='Creator Test';duplicates[1].querySelector('.rb-fbp-row-save').click();await pause();
 assert.equal(writes.length,1);const edited=w._fblSummaryData.filter(r=>r.creatorFacebook==='Creator Test');assert.equal(edited.length,1,'editing duplicate name updates only selected row');assert.equal(edited[0].st,statuses[1]);
 console.log('PASS: rendered 200 rows, all seven employee filters, duplicate names edit independently, creator field saved');dom.window.close();
})().catch(e=>{console.error(e);dom.window.close();process.exitCode=1});

