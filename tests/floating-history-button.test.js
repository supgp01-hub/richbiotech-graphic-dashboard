const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('index.html', 'utf8');

assert.equal(html.includes("btn.id='rb-tl-btn'"), false, 'the removed floating history button must not be created');
assert.equal(html.includes('setTimeout(addFloatingUI'), false, 'the removed floating history button must not be scheduled after startup');
assert.equal(html.includes('#rb-tl-btn{'), false, 'obsolete floating-button layout rules must be removed');
assert.ok(html.includes('function openTLM()'), 'removing the floating button must not erase stored timeline functionality or data');
assert.ok(html.includes('<meta name="rb-build" content="fix361">'), 'the public page must expose the current release');

console.log('floating-history-button: removed without deleting timeline data');
