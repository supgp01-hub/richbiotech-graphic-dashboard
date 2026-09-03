const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const auth = fs.readFileSync(path.join(root, 'snippets', 'firebase-secure-auth-v1.js'), 'utf8');
const rules = JSON.parse(fs.readFileSync(path.join(root, 'database.rules.json'), 'utf8')).rules;

test('production uses the secured Firebase project only', () => {
  const production = [html, ...fs.readdirSync(path.join(root, 'snippets')).filter(name => name.endsWith('.js')).map(name => fs.readFileSync(path.join(root, 'snippets', name), 'utf8'))].join('\n');
  assert.doesNotMatch(production, /richbiotech-graphic-ads-default-rtdb/);
  assert.match(html, /firebase-secure-auth-v1\.js/);
  assert.match(auth, /GoogleAuthProvider/);
  assert.match(auth, /browserLocalPersistence/);
});

test('legacy PIN secrets are removed from the shipped page', () => {
  assert.doesNotMatch(html, /pin:"\d{4}"/);
  assert.match(html, /var DU=\[\];var ORIG=\{\}/);
});

test('database defaults to deny and protects sensitive paths', () => {
  assert.equal(rules['.read'], false);
  assert.equal(rules['.write'], false);
  assert.match(rules.idcards['.read'], /role.*sup/);
  assert.match(rules.rb_users['.read'], /role.*sup/);
  assert.equal(rules.rb_users['.write'], false);
  assert.match(rules.orders['.read'], /active/);
  assert.match(rules.orders['.write'], /active/);
});

test('supervisor bootstrap is limited to the confirmed company email', () => {
  assert.match(rules.auth_users.$uid['.write'], /supgp01@richbiotech\.com/);
  assert.match(auth, /SUPERVISOR_EMAIL='supgp01@richbiotech\.com'/);
});
