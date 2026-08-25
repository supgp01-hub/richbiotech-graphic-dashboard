const assert=require('assert');
const fs=require('fs');
const path=require('path');

const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const snippets=fs.readdirSync(path.join(root,'snippets'))
  .filter(name=>name.endsWith('.js'))
  .map(name=>fs.readFileSync(path.join(root,'snippets',name),'utf8'))
  .join('\n');
const source=index+'\n'+snippets;
const handlers=new Set();
const attributes=source.match(/on(?:click|change|input|submit|keydown|keyup|pointerdown|touchstart)\s*=\s*["'][^"']*["']/gis)||[];
attributes.forEach(attribute=>{
  for(const match of attribute.matchAll(/window\.([A-Za-z_$][\w$]*)/g))handlers.add(match[1]);
});
const missing=[...handlers].filter(name=>{
  const escaped=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return !new RegExp(`window\\.${escaped}\\s*=`).test(source)&&
    !new RegExp(`root\\.${escaped}\\s*=`).test(source)&&
    !new RegExp(`function\\s+${escaped}\\s*\\(`).test(source);
});

assert.deepStrictEqual(missing,[],`inline controls reference missing handlers: ${missing.join(', ')}`);
assert.ok(index.includes('snippets/control-reliability-v1.js?v=fix276'),'control reliability runtime must be loaded');
assert.ok(source.includes('root.rbAuditControls=function'),'runtime control audit must be available');
console.log(`control-reliability-v1 tests passed (${handlers.size} handlers checked)`);
