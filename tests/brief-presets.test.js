const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('index.html', 'utf8');
const block = source.match(/var BRIEF_PRESETS=\[([\s\S]*?)\];/);
assert.ok(block, 'brief preset collection must exist');

const presets = Array.from(block[1].matchAll(/'([^']+)'/g), match => match[1]);
assert.equal(presets.length, 8, 'the two duplicate suggestions should be collapsed into eight unique options');
assert.equal(new Set(presets).size, presets.length, 'brief presets must not contain duplicate choices');
assert.ok(source.includes("option.onclick=function(){textarea.value=preset"), 'selecting a preset must copy it into the editable textarea');
assert.ok(source.includes("brief:ge('om-brief').value||''"), 'edited brief text must still be saved with the order');
assert.ok(source.includes("ge('om-brief').value=o?(o.brief||''):''"), 'saved brief text must still load when editing an order');

console.log('brief-presets: all tests passed');
