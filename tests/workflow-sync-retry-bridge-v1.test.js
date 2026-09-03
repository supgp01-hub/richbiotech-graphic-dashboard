const assert=require('node:assert/strict');
const fs=require('node:fs');

const index=fs.readFileSync('index.html','utf8');
const bridge=fs.readFileSync('snippets/workflow-sync-retry-bridge-v1.js','utf8');

assert.match(index,/workflow-sync-retry-bridge-v1\.js\?v=fix338/,'the retry bridge must be loaded');
assert.match(bridge,/closest\('#rb-ops-retry'\)/,'the bridge must target the health retry button');
assert.match(bridge,/root\.rbPersistence\.flush\(\)/,'the retry button must flush generic writes');
assert.match(bridge,/root\.fbFlushOrderQueue\(\)/,'the retry button must flush order writes');

console.log('workflow-sync-retry-bridge-v1: all tests passed');
