const {JSDOM}=require('jsdom'),fs=require('fs'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8'),script=html.match(/<script id="rb-global-dropdown-v5-script">([\s\S]*?)<\/script>/)[1];
const dom=new JSDOM('<select><option value="">Choose</option><option value="old">Old item</option></select>',{runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window;w.HTMLElement.prototype.scrollIntoView=function(){};w.eval(script);w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
const select=w.document.querySelector('select');
(async()=>{select.dispatchEvent(new w.MouseEvent('pointerdown',{bubbles:true,cancelable:true}));
assert.equal(w.document.querySelectorAll('.rb-dd-option').length,2);
select.innerHTML='<option value="">Choose</option>'+Array.from({length:155},(_,i)=>'<option value="name'+i+'">Job '+i+'</option>').join('');
await new Promise(r=>w.setTimeout(r,0));assert.equal(w.document.querySelectorAll('.rb-dd-option').length,156);
const search=w.document.querySelector('.rb-dd-search');
// Keep an active search when another cloud refresh rebuilds the options.
const input=search||w.document.querySelector('#rb-dd-popover input');input.value='Job 154';input.dispatchEvent(new w.Event('input'));
select.appendChild(new w.Option('New job','new'));await new Promise(r=>w.setTimeout(r,0));assert.equal(input.value,'Job 154');
const button=Array.from(w.document.querySelectorAll('.rb-dd-option')).find(b=>b.textContent.includes('Job 154'));button.click();assert.equal(select.value,'name154');
w.close();console.log('PASS: open dropdown refreshes all 155 names, preserves search, selects the current option');})();
