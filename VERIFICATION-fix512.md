# fix512 — Remove the 26–25 shortcut

Removed the order-filter calendar's 26–25 shortcut button and its styling. Manual start/end selection, cross-month/year ranges, clear, today and ordinary deadline fields are unchanged. Updated the range tests to choose both bounds manually instead of using the removed shortcut, retaining the year-boundary and mobile selection assertions. Browser coverage also asserts that the shortcut is absent. No production records are modified.
- Validation: 143/143 regression scripts passed. All 26 distinct browser suites passed after an isolated rerun of the existing Facebook Pages action-slot geometry check; no related production code or assertions were changed. Inspected the local calendar screenshot: shortcut absent and range highlighted.
