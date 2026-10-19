# fix513 — date range shortcuts

Adds Today, Yesterday, This week (Sunday–Saturday), and This month shortcuts only to the order-list Deadline range filter. The calendar highlights the selected range and displays its full dates and inclusive day count. The collapsed filter retains the compact selected dates. Desktop uses a side rail; mobile places shortcuts above the calendar. Manual selection, cancellation, clear, and single-date job fields retain their existing behavior. The removed 26–25 shortcut stays absent.

Validation before deployment:
- Full isolated regression runner: 144/144 passed.
- Required browser suites: 27/27 invocations passed (26 distinct suites; ID-card load ran twice).
- Additional mobile cross-device run passed.
- Date picker browser suite also passed separately; desktop/mobile screenshots inspected.
- New behavioral coverage checks all presets, cross-year boundaries, inclusive counts, draft cancellation, and isolation from single-date fields.
- HTML: 639267 bytes; release.json and rb-build: fix513. git diff --check passed.

No production records were used as test fixtures. Production build/assets and signed-in UI are checked after deployment; tests do not establish behavior on every employee device or network.
