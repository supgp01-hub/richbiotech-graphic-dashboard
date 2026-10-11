# fix503 — Inline campaign actions

- Applied the approved combined-input design: trash on the left and open-link at the far right, separated by a quiet divider.
- Reused the existing delete and open button nodes/handlers. Only the removable extra campaign rows receive a trash button; legacy permissions and initial single-version behavior stay intact.
- Reserved equal action space on every row; equal button dimensions, aligned columns and 44 px touch targets.
- No data schema or permission changes.

Verification: 139/139 regression scripts, 24/24 workflow browser suites and the additional mobile cross-device suite passed. Extended the campaign browser test to check button order, equal sizes, inline placement, opening the original URL and removing an extra row while retaining other campaign data. Save/reopen, single initial version, employee and mobile tests pass. Light/dark screenshots inspected locally with isolated mock data.

HTML is 639,952 bytes. HTML and release.json declare fix503. Changed assets are cache-busted. Public Pages deployment and asset hashes are checked after push; production test records are not created. Signed-in production UI verification depends on the browser connection; previous attempts timed out. This note does not claim real employee submissions were exercised.
