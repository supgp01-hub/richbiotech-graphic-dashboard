# Release verification

The owner requires verification across the system before each delivery, not only the reported screenshot.

- Run `node tests/run-regression.cjs <report-path>` with jsdom available before every production push. It discovers all top-level `*.test.js` / `*.test.cjs` files, disables external network, and fails the run on any failure or timeout.
- Diagnose every failure. Do not remove assertions simply to obtain a passing result. If a fixture predates a production API change, update the fixture while retaining its business guarantee.
- Run `tests/manual/full-functional-smoke.e2e.js` against a local server with mocked authentication. It covers the five sidebar destinations, eight Graphic panels, online health panel, commission view switch, and new-order button.
- Run `node tests/manual/audit-persistence452.e2e.cjs`. Its isolated browser sessions exercise Audit save/reload, stale forms, realtime changes and employee revision submission against a stateful Firebase transport with ETags. Production work must not be used as test fixtures.
- Run `node tests/manual/review-rounds453.e2e.cjs`. It exercises initial submission, two correction cycles, both employee submit paths, two HOOKs in one round, duplicate prevention, history display, approval and reload with a stateful isolated backend.
- Run `node tests/manual/cross-device455.e2e.cjs` for independent employee/Audit contexts, offline retry, automatic shared reads, repeated in-flight edits, server clears and safe release-update deferral. Keep `release.json` equal to the HTML build on every release.
- Run `node tests/manual/auth-recovery456.e2e.cjs` and `node tests/manual/conflict-recovery458.e2e.cjs` for bounded session restoration and supervisor recovery with a central receipt consumed by a separate employee browser.
- Run `node tests/manual/content-inline460.e2e.cjs` for receive-work HOOK submissions, inline history, draft retention, offline retry, role guards, and another browser reading the saved text. Run `node tests/content-submissions-rules.e2e.js` against the local database emulator on port 19000 whenever content permissions or submission schema changes.
- Add behavioral regression coverage for the reported fault. For save/sync changes, cover quota exhaustion, offline/retry, partial success, concurrent edits, and account/role boundaries as applicable. A success message must require an online acknowledgement when claiming online success.
- Inspect the signed-in production UI after deployment and verify the public build and changed assets. Do not claim a production save or all employee accounts were tested if only mocks or a single account were used.
- Never seed test records into real employee work or change work status merely to exercise buttons. Use isolated local fixtures for such scenarios. Preserve drafts and evidence.
- Stage only intended release files. Private backups, credentials, local reports, and helper exports must not enter Git.
- Run `node tests/manual/release-auto462.e2e.cjs` before deployment for automatic update discovery across devices, background tabs, unsaved edits, pending content saves, reconnect and delayed CDN HTML.
- Run `node tests/manual/content-append463.e2e.cjs` for CSV append with exhausted browser storage: old and new records must remain in the current UI, online data, another browser and after reload.
- Production is GitHub Pages at `https://supgp01-hub.github.io/richbiotech-graphic-dashboard/`. Confirm the remote before pushing. Keep the initial HTML below 640,000 bytes.
- Record the build, tested scope, results, and any unverified scope in a release verification note. Passing tests reduce known risks; they do not establish that every future network/device condition is impossible.

- Run `node tests/manual/audit-adjustments464.e2e.cjs` for deduction increases/removals, totals, concurrent devices, offline forms and idempotent retries. Run `node tests/audit-adjustments-rules.e2e.cjs` against the local port-19000 emulator for immutable history and Supervisor/Audit-only writes when adjustment permissions or schema changes.
- Run `node tests/manual/thai-holidays465.e2e.cjs` for calendar holiday annotations, staff/ribbon preservation, date dialog, toggle, mobile/dark layout and month/year navigation. Update verified holiday dates from authoritative announcements; never treat a calendar annotation as employee leave or company closure.

- Run `node tests/manual/audit-evidence470.e2e.cjs` before deployment for actual worksheet hyperlinks, date/employee mapping, legacy-ID preservation, link-only online repair, changed-link deduplication, separate employee contexts, offline/partial-write retries and append-only imports.
- Run `node tests/manual/audit-inline474.e2e.cjs` for ledger details directly below their selected row, expansion/collapse, refresh/filter behavior, evidence, responsive layouts and employee permission boundaries.
