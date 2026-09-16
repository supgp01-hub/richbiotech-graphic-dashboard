# fix470 — Audit evidence links from the source worksheet

Audit imports now read the workbook's actual hyperlink relationships instead of importing only Google Visualization display labels. The selected deduction shows separate evidence and source-row links. Evidence is matched by date, employee and the existing deduction details, and repaired in a dedicated child field without replacing the financial record or its ID. Managers persist repairs centrally; employee views read the same source and stored repair. No fixed evidence workbook is reused across employees or dates.

New imports use evidence-independent identity, conditional creation, and per-record writes. Link repairs use conditional writes. Failed or partial operations are not presented as successful; ambiguous source matches are not guessed. Last confirmed links are labelled when the current source cannot be checked. Changes to amounts, dates or other deduction facts remain outside automatic link-only repair.

Validation on 16 September 2026:

- 122/122 regression scripts passed.
- All 11 existing isolated browser suites passed: whole-app navigation, Audit persistence, review rounds, cross-device sync, auth recovery, conflict recovery, content history, release updates, append imports, deduction adjustments and calendar.
- New `audit-evidence470.e2e.cjs` passed: 12 distinct employee/date targets and source rows; preservation of legacy IDs, amounts and decisions; changed-link deduplication; separate employee account; no employee writes; full local storage; failed reads and partial writes; lost acknowledgement for repair and new import; simultaneous manager sync; append and retry without duplicate charges.
- The parser read all 12 real hyperlinks from the user's exported source workbook. An isolated Chrome session also fetched the actual workbook cross-origin and resolved all 12 URLs successfully. No real employee records were used as test fixtures.
- Initial HTML: 637,716 bytes, below 640,000. No database permission changes and no additional third-party proxy or dependency.

Delivery checks: GitHub regression and Pages, public build/asset hashes, signed-in production evidence targets and unchanged displayed deduction totals. These checks do not constitute testing every physical employee device. CLI Firebase credentials had expired; production UI verification uses the existing signed-in Supervisor session.
