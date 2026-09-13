const assert=require('node:assert/strict'),fs=require('node:fs');const {JSDOM}=require('jsdom');
const dom=new JSDOM('<div id="fp-form-box" style="display:none"></div><div id="fbl-root"></div><span id="lfb-ts"></span>',{url:'https://example.test',runScripts:'outside-only'}),w=dom.window;
w._fpKey='pages';w._fpManual=[];w._fpOwnersCache=['NUNE','TER'];w._fpProdsCache=['WOLF+'];w._lfbData=[{name:'Existing page'}];w._fpMerge=rows=>rows.concat(w._fpManual);let rendered=[];w._renderFbList=(root,rows)=>{rendered=rows;};
w.eval(fs.readFileSync('snippets/facebook-pages-create-v1.js','utf8'));
(async()=>{
 w._fpToggleForm();const input=id=>w.document.getElementById(id);input('fp-in-name').value='New Page';input('fp-in-prod').value='WOLF+';input('fp-in-own').value='NUNE';input('fp-in-creator').value='Nune Richbiotech';
 let resolve,writes=[];w.fbSet=(path,data)=>{writes.push({path,data});return new Promise(r=>resolve=r);};
 let save=w._fpSaveEntry();await Promise.resolve();assert.equal(input('fp-create-save').disabled,true);assert.equal(w._fpManual.length,0);assert(input('fp-create-form'),'form stays open until acknowledgement');
 await w._fpSaveEntry();assert.equal(writes.length,1,'double click does not submit twice');resolve(false);assert.equal(await save,false);assert.equal(input('fp-in-name').value,'New Page');assert(input('fp-err').textContent.includes('ข้อมูลที่กรอกยังอยู่'));const id=writes[0].data.id;
 w.localStorage.setItem('unrelated','keep');Object.defineProperty(w.Storage.prototype,'setItem',{value(){throw new Error('QuotaExceededError');}});
 w.fbSet=(path,data)=>{writes.push({path,data});return Promise.resolve(true);};assert.equal(await w._fpSaveEntry(),true);assert.equal(writes[1].data.id,id,'retry reuses the same server ID');assert.equal(w._fpManual.length,1);assert.equal(w._fpManual[0].creatorFacebook,'Nune Richbiotech');assert.equal(rendered.length,2);assert.equal(w.document.getElementById('fp-form-box').style.display,'none');assert(w.document.getElementById('lfb-ts').textContent.includes('ออนไลน์เรียบร้อย'));
 assert(writes.every(x=>x.path==='/fbpages_manual/'+id),'never overwrite the full pages collection');
 console.log('PASS: add page waits for server, failure retains form, safe retry, quota full, creator persisted, immediate list update');dom.window.close();
})().catch(e=>{console.error(e);dom.window.close();process.exitCode=1;});
