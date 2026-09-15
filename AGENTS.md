# Release verification

The owner requires verification across the system before each delivery, not only the reported screenshot.

- Run `node tests/run-regression.cjs <report-path>` with jsdom available before every production push. It discovers all top-level `*.test.js` / `*.test.cjs` files, disables external network, and fails the run on any failure or timeout.
- Diagnose every failure. Do not remove assertions simply to obtain a passing result. If a fixture predates a production API change, update the fixture while retaining its business guarantee.
- Run `tests/manual/full-functional-smoke.e2e.js` against a local server with mocked authentication. It covers the five sidebar destinations, eight Graphic panels, online health panel, commission view switch, and new-order button.
- Run `node tests/manual/audit-persistence452.e2e.cjs`. Its isolated browser sessions exercise Audit save/reload, stale forms, realtime changes and employee revision submission against a stateful Firebase transport with ETags. Production work must not be used as test fixtures.
- Run `node tests/manual/review-rounds453.e2e.cjs`. It exercises initial submission, two correction cycles, both employee submit paths, two HOOKs in one round, duplicate prevention, history display, approval and reload with a stateful isolated backend.
- Run `node tests/manual/cross-device455.e2e.cjs` for independent employee/Audit contexts, offline retry, automatic shared reads, repeated in-flight edits, server clears and safe release-update deferral. Keep `release.json` equal to the HTML build on every release.
- Run `node tests/manual/auth-recovery456.e2e.cjs` and `node tests/manual/conflict-recovery458.e2e.cjs` for bounded session restoration and supervisor recovery with a central receipt consumed by a separate employee browser.
- Add behavioral regression coverage for the reported fault. For save/sync changes, cover quota exhaustion, offline/retry, partial success, concurrent edits, and account/role boundaries as applicable. A success message must require an online acknowledgement when claiming online success.
- Inspect the signed-in production UI after deployment and verify the public build and changed assets. Do not claim a production save or all employee accounts were tested if only mocks or a single account were used.
- Never seed test records into real employee work or change work status merely to exercise buttons. Use isolated local fixtures for such scenarios. Preserve drafts and evidence.
- Stage only intended release files. Private backups, credentials, local reports, and helper exports must not enter Git.
- Production is GitHub Pages at `https://supgp01-hub.github.io/richbiotech-graphic-dashboard/`. Confirm the remote before pushing. Keep the initial HTML below 640,000 bytes.
- Record the build, tested scope, results, and any unverified scope in a release verification note. Passing tests reduce known risks; they do not establish that every future network/device condition is impossible.
