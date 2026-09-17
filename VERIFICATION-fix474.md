# fix474 — deduction details expand below the selected ledger row

Supervisor/Specialist per-person ledgers and employee ledgers now insert the selected detail immediately after its source row. Opening another row replaces the expanded detail; the selected row and a footer button can collapse it. Focus returns to the row button. Dirty account-edit fields require confirmation before closing or switching. Audit's queue/workbench layout and existing financial/evidence permissions remain unchanged.

Inline detail rows are excluded from pagination totals, follow their source row's visibility and preserve the current page on expansion/collapse. Narrow screens retain the title, actual amount, status and detail action without horizontal table overflow. Header text remains readable on the green surface.

Verification on 17 September 2026:

- 124 regression scripts, including actual DOM adjacency, single expansion, toggle/collapse, refresh, focus, dirty-field cancellation and employee boundaries.
- 13 isolated browser suites: the new inline ledger suite plus all existing required suites for navigation, Audit persistence/rounds/evidence/adjustments, cross-device sync, recovery, content history/imports, release updates and calendar.
- New browser coverage checks evidence destinations, staff restrictions, mobile/dark layouts, offline viewing, unchanged workbench and a 53-row ledger: page 2 remains selected, detail rows do not inflate totals and hidden source rows hide their details.
- Fixed an existing browser test race by waiting for asynchronous stale-state feedback before asserting it. The assertions that no stale write occurs and that the correction status is retained remain unchanged.
- Initial HTML: 637,810 bytes; HTML build and release.json both fix474. Changed JavaScript/CSS URLs are versioned. No financial records, database permissions or schema changes are part of this release.

Delivery checks: Pages/CI for the committed release, public build/asset comparison and signed-in production expansion/collapse inspection. Production verification uses existing records read-only; financial mutations are exercised only with isolated test data. Tests do not imply every physical employee device was inspected.
