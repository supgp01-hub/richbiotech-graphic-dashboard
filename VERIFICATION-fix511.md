# fix511 — Order deadline range filter

Only the order-list date filter now supports choosing a start and end date across months. The 26–25 shortcut selects the previous month's 26th through the displayed month's 25th. Filtering includes both boundaries and excludes undated work. Selecting the same day twice still filters one date. Cancel preserves the applied range; clear and existing filter resets retain their behavior. Actual work deadline inputs remain single-date controls.

The existing per-viewer scope is unchanged. No job records are rewritten. Dates use local calendar components and canonical ISO bounds; reverse selections are sorted. Keyboard focus stays in the picker after the first selection. The compact input shows the range and exposes full dates in its title.

Validation: 143 regression scripts passed, including draft/cancel, reverse bounds, December–January, single-day, inclusive filtering and missing deadlines. Extended browser coverage checks cross-month selection, highlighting, mobile fit, shortcut, clear, and unchanged task deadline behavior. A resize/scroll timing issue in the mobile test was resolved by waiting for layout to settle before opening the picker; targeted rerun passed. Required browser suites run before push. No production data saves performed during verification.
- All 26 distinct required browser suites passed (27 successful invocations). HTML is 639267 bytes, below the 640000-byte limit.
