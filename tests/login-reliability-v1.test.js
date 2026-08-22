const assert = require('node:assert/strict');
const fs = require('node:fs');

const code = fs.readFileSync('snippets/login-reliability-v1.js', 'utf8');
const css = fs.readFileSync('snippets/login-reliability-v1.css', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');

assert.ok(index.includes('snippets/login-reliability-v1.js?v=206'), 'login reliability fix must be loaded');
assert.ok(index.includes('snippets/login-reliability-v1.css?v=206'), 'the lightweight responsive login design must be loaded');
assert.ok(index.indexOf('login-reliability-v1.js?v=206') < index.indexOf('rb-global-dropdown-v5-css'), 'login fix must opt out before global dropdown enhancement');
assert.ok(code.includes("select.setAttribute('data-rb-dd-off','')"), 'login name must use the browser-native selector');
assert.ok(code.includes("pin.value.length===4&&!select.value"), 'PIN must not submit before a name is selected');
assert.ok(code.includes("event.stopImmediatePropagation()"), 'premature auto-submit must be stopped');
assert.ok(code.includes("if(select.value&&pin.value.length===4)"), 'selecting a name after entering the PIN must continue login');
assert.ok(code.includes("localStorage.getItem('rb_users')"), 'the visible names must refresh after cloud users arrive');
assert.ok(code.includes("'นุ่น':'Nune',Nune:'นุ่น'"), 'Thai and English employee-name migration must be preserved');
assert.ok(code.includes("pin.setAttribute('inputmode','numeric')"), 'mobile users must receive a numeric keyboard');
assert.ok(css.includes('#rb-login-modal>div[style*="position:absolute"]'), 'GPU-heavy full-screen blur decorations must be disabled');
assert.ok(css.includes('#rb-login-pin{'), 'the PIN must be a real visible input instead of a hidden field');
assert.ok(css.includes('@media(max-width:640px)'), 'the login layout must adapt to mobile screens');

console.log('login-reliability-v1: all tests passed');
