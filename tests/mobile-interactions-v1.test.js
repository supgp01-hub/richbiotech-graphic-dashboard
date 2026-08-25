const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const dropdownScript = html.match(/<script id="rb-global-dropdown-v5-script">([\s\S]*?)<\/script>/);

function expect(pattern, message) {
  if (!pattern.test(html)) throw new Error(message);
}

expect(/content="fix281-order-detail-edit"/, 'mobile interaction build marker is missing');
expect(/\(!e\.pointerType\|\|e\.pointerType==='mouse'\)&&e\.button!==0/, 'touch pointer must not be rejected by the mouse-button guard');
expect(/Mobile WebViews may emit click without a usable pointerdown/, 'click-only mobile fallback is missing');
expect(/suppressClickUntil=Date\.now\(\)\+500/, 'pointerdown/click double event guard is missing');
expect(/bottom:calc\(12px \+ env\(safe-area-inset-bottom,0px\)\)/, 'mobile dropdown bottom-sheet position is missing');
expect(/\.rb-dd-option\{min-height:46px;font-size:14px;touch-action:manipulation\}/, 'mobile dropdown tap targets are too small');
expect(/if\(active&&window\.matchMedia&&window\.matchMedia\('\(max-width:640px\)'\)\.matches\)return;/, 'mobile scroll must not close the dropdown sheet');
expect(/active\.options\.length>8&&\!\(window\.matchMedia&&window\.matchMedia\('\(max-width:640px\)'\)\.matches\)/, 'mobile dropdown must not force-open the keyboard');
expect(/if\(active&&\(!document\.documentElement\.contains\(active\)\|\|active\.disabled\)\)close\(\);/, 'stale dropdown overlay cleanup is missing');
expect(/!select\.hasAttribute\('data-rb-dd-off'\)/, 'native dropdown opt-out must remain supported');
if (!dropdownScript) throw new Error('global dropdown runtime is missing');
new Function(dropdownScript[1]);

console.log('mobile-interactions-v1 tests passed');
