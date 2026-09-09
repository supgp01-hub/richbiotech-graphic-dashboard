const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
test('holiday observer ignores other tabs and coalesces relevant updates',()=>{
 const src=fs.readFileSync('snippets/leave-day-actions-v2.js','utf8');const start=src.indexOf('function scheduleRefresh('),end=src.indexOf('\nfunction install',start);let queued=[],runs=0;
 const c={refreshQueued:false,setTimeout:fn=>queued.push(fn),refresh:()=>runs++};vm.createContext(c);vm.runInContext(src.slice(start,end),c);
 const outside={nodeType:1,closest:()=>null},inside={nodeType:1,closest:()=>({})};
 for(let i=0;i<100;i++)c.scheduleRefresh([{target:outside,addedNodes:[]}]);assert.equal(queued.length,0);
 for(let i=0;i<100;i++)c.scheduleRefresh([{target:inside,addedNodes:[]}]);assert.equal(queued.length,1);queued.shift()();assert.equal(runs,1);
 c.scheduleRefresh([{target:inside,addedNodes:[]}]);assert.equal(queued.length,1);
});
