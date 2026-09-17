# fix473 — calendar note display and batch leave validation

Imported historical leave no longer repeats its administrative backfill note underneath every employee name. The original note remains in the tooltip, record and history; ordinary notes remain visible.

Both multiple-date entry paths now validate the complete proposed batch before saving. Previously each proposed date was checked against only existing leave, allowing the combined batch to exceed a cycle or annual quota or consecutive-day limit. Validation excludes the edited original, checks duplicates and staffing rules, restores the live data in a synchronous finally block, and performs no persistence writes. The legacy multi-date form also rechecks immediately before saving. Existing documented quota-exception behavior is retained; notes still cannot bypass duplicate or staffing restrictions.

Verification on 17 September 2026:

- 123/123 regression scripts passed, including new behavioral coverage for the 25/26 boundary, December/January, leap February, separate annual vacation counts, projected batch totals, edit accounting, duplicates, staffing, consecutive days and note preservation.
- The calendar browser suite verifies hidden inline backfill notes with retained tooltips and rejects an over-quota multi-date save without writing any partial records. It also covers holiday mapping, staff/ribbons, date dialogs, filters, mobile/dark layouts and month/year navigation.
- Release gate: all 12 required isolated browser suites (calendar, full navigation, Audit evidence/adjustments/persistence, review rounds, cross-device continuity, authentication/conflict recovery, content history/imports and automatic releases).
- Initial HTML: 637,810 bytes. HTML build and release manifest both fix473. No database rules or leave schema changes.
- Signed-in production read-back before deployment checked all imported source records after reload, preservation of pre-existing records, absence of duplicate employee/day entries and actual cycle summaries. Private employee data and the detailed quota audit remain outside Git. No existing leave was removed or reclassified to force quota compliance.

Delivery checks: GitHub Pages/CI for the release commit, public build and asset hashes, then signed-in calendar inspection. Isolated tests and one signed-in account do not establish that every physical employee device or simultaneous cross-device quota race was tested. Documented quota exceptions remain possible under the existing policy.
