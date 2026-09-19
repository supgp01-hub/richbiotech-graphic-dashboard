const assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
const html=fs.readFileSync('index.html','utf8').replace(/\r/g,''),start=html.indexOf('window._renderFbList=function('),end=html.indexOf('\n}\nvar _mFB=',start);
function setup(edits){
 const dom=new JSDOM('<div id="fbl-root"></div>',{url:'https://example.test',runScripts:'outside-only'}),w=dom.window;
 w._rbUser={role:'sup',name:'Test'};w.fbSet=()=>{throw Error('Presentation must not write business data');};
 if(edits)w.localStorage.setItem('rb_fbpages_edits_v2',JSON.stringify(edits));
 w.eval(html.slice(start,end));
 for(const name of ['facebook-pages-source-v1.js','facebook-pages-inline-editor-v2.js'])w.eval(fs.readFileSync('snippets/'+name,'utf8'));
 return dom;
}
const pause=()=>new Promise(r=>setTimeout(r,90));
(async()=>{
 const dom=setup(),w=dom.window;
 const rows=[{name:'เพจ 162',st:'ใช้งาน',own:'BALL'}, {name:'เพจ๑๖๓'}, {name:' เพจ  164 '},
  {name:'ขุนแผน คืนพลังชาย โทร.02-124-3032',prod:'ขุนแผน',st:'ว่าง',shareFacebook:'Account A'},
  {name:'Studio 162',creatorFacebook:'Creator B'}, {name:'เพจ 162 ของทีม',manual:true,id:'manual-1'},
  {name:'ชื่อเพจจริง',creatorFacebook:'ยังไม่ระบุ',shareFacebook:'—'}];
 const original=JSON.stringify(rows),root=w.document.getElementById('fbl-root');
 w._renderFbList(root,rows);await pause();
 assert.equal(root.querySelectorAll('#fbl-body tr[data-name]').length,4);
 assert.equal(w._fblSummaryData.length,4,'counts and filters include named pages only');
 assert.equal(root.querySelector('.fblpb[data-p="ALL"]').textContent,'ALL(4)');
 assert.equal(JSON.stringify(rows),original,'raw source is preserved without mutation');
 assert.equal(root.textContent.includes('เฟสที่สร้าง: ยังไม่ระบุ'),false);
 assert.equal(root.textContent.includes('เฟสที่แชร์ได้: —'),false);
 assert.match(root.textContent,/เฟสที่แชร์ได้: Account A/);
 assert.match(root.textContent,/เฟสที่สร้าง: Creator B/);
 const search=root.querySelector('#fbl-q');search.value='เพจ 162';search.dispatchEvent(new w.Event('input'));await pause();
 assert.equal(root.querySelectorAll('#fbl-body tr[data-name]').length,1,'a legitimate name containing a number remains searchable');
 assert.equal(root.querySelector('#fbl-body tr[data-name]').dataset.name,'เพจ 162 ของทีม');
 const key=w._fbpInlineEditorTest.rowKey(w.rbFacebookPagesSource.normalize(rows)[0]);
 const renamed=setup({[key]:{name:'ชื่อเพจที่แก้ไขแล้ว',sourceName:'เพจ 162',updatedAt:1}});
 renamed.window._renderFbList(renamed.window.document.getElementById('fbl-root'),rows);await pause();
 assert.equal(renamed.window._fblSummaryData.length,5,'a corrected name becomes visible after applying saved edits');
 assert.ok(renamed.window._fblSummaryData.some(r=>r.name==='ชื่อเพจที่แก้ไขแล้ว'&&r._fbpKey===key),'restored row retains identity');
 w._renderFbList(root,rows.slice(0,3));await pause();
 assert.equal(root.querySelectorAll('#fbl-body tr[data-name]').length,0);
 assert.equal(w._fblSummaryData.length,0,'all-placeholder source produces an empty view');
 dom.window.close();renamed.window.close();
 console.log('PASS named-only display, consistent counts/search, preserved source, metadata and renamed-row identity');
})().catch(e=>{console.error(e);process.exitCode=1});
