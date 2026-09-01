const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('snippets/collection-write-guard-v1.js','utf8');
const writes=[];
const window={
  _fpManual:[{id:'one',name:'เดิม'},{id:'remove',name:'ลบ'}],
  _fpSaveLocal(rows){this._fpManual=rows;},
  _fpSave(){throw new Error('full collection writer must be replaced');},
  fbSet(path,value){writes.push({path,value});return Promise.resolve(true);}
};
const document={documentElement:{setAttribute(name,value){this[name]=value;}}};
const context={window,document,Promise,JSON,Object,Array,String,setTimeout(){return 1;}};
vm.createContext(context);vm.runInContext(source,context);

(async function(){
  assert.equal(window._rbCollectionWriteGuardTest.version,'1.0.0');
  await window._fpSave([{id:'one',name:'แก้แล้ว'},{id:'new',name:'เพิ่ม'}]);
  assert.deepEqual(writes.map(x=>x.path).sort(),['/fbpages_manual/new','/fbpages_manual/one','/fbpages_manual/remove']);
  assert.equal(writes.find(x=>x.path==='/fbpages_manual/remove').value,null,'deleted rows must create a queued child delete');
  assert.equal(writes.some(x=>x.path==='/fbpages_manual'),false,'the whole collection must never be overwritten');
  console.log('collection-write-guard-v1: all tests passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
