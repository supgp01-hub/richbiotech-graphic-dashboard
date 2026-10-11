const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const source=fs.readFileSync('snippets/order-audit-version-workflow-v1.js','utf8');
const dom=new JSDOM('<body>'),copied=[];
const context={document:dom.window.document,URL,copyText:value=>copied.push(value)};
vm.createContext(context);vm.runInContext(source.slice(source.indexOf('  function linkRow('),source.indexOf('  function compress(')),context);
for(const value of ['https://drive.google.com/drive/folders/test','KP : https://drive.google.com/drive/folders/test']){
 const row=context.linkRow('ภาพ',value);assert.equal(row.querySelector('a').href,'https://drive.google.com/drive/folders/test');assert.equal(row.querySelector('span').textContent,value);row.querySelector('button').click();assert.equal(copied.at(-1),'https://drive.google.com/drive/folders/test');
}
for(const value of ['', 'KP :', 'javascript:alert(1)','https://','https://a.test https://b.test']){
 const row=context.linkRow('ภาพ',value);assert.equal(row.querySelector('a'),null);assert.equal(row.querySelectorAll('button').length,2);assert.equal(row.lastElementChild.disabled,true);assert.equal(row.firstElementChild.textContent,'ภาพ');
}
console.log('PASS labeled URL actions, original display, copy, disabled empty/unsafe/ambiguous URLs');
