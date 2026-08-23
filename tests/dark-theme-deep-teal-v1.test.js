const fs = require('fs');
const assert = require('assert');

const source = fs.readFileSync('index.html', 'utf8');

assert(source.includes('id="rb-dark-theme-deep-teal-v1"'), 'approved Deep Teal dark theme is missing');
assert(source.includes('--surface-page:#020708'), 'approved darkest page surface is missing');
assert(source.includes('--surface-card:#071214'), 'approved card surface is missing');
assert(source.includes('--surface-card-border:#264449'), 'approved border contrast is missing');
assert(source.includes('--text-heading:#f5faf9'), 'high-contrast primary text is missing');
assert(source.includes('html[data-theme="dark"] #lfb-root .lfb-min-stat-ok'), 'List Facebook dark surfaces are not covered');
assert(source.includes('html[data-theme="dark"] #rb-order-modal'), 'order modal dark surfaces are not covered');
assert(source.includes('html[data-theme="dark"] #rb-bottom-nav'), 'mobile navigation dark surfaces are not covered');

console.log('dark theme Deep Teal v1 tests passed');
