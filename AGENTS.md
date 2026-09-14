# Release verification

The owner requires verification across the system before each delivery, not only the reported screenshot.

- Run `node tests/run-regression.cjs <report-path>` with jsdom available before every production push. It discovers all top-level `*.test.js` / `*.test.cjs` files, disables external network, and fails the run on any failure or timeout.
- Diagnose every failure. Do not remove assertions simply to obtain a passing result. If a fixture predates a production API change, update the fixture while retaining its business guarantee.
- Run `tests/manual/full-functional-smoke.e2e.js` against a local server with mocked authentication. It covers the five sidebar destinations, eight Graphic panels, online health panel, commission view switch, and new-order button.
- Add behavioral regression coverage for the reported fault. For save/sync changes, cover quota exhaustion, offline/retry, partial success, concurrent edits, and account/role boundaries as applicable. A success message must require an online acknowledgement when claiming online success.
- Inspect the signed-in production UI after deployment and verify the public build and changed assets. Do not claim a production save or all employee accounts were tested if only mocks or a single account were used.
- Never seed test records into real employee work or change work status merely to exercise buttons. Use isolated local fixtures for such scenarios. Preserve drafts and evidence.
- Stage only intended release files. Private backups, credentials, local reports, and helper exports must not enter Git.
- Production is GitHub Pages at `https://supgp01-hub.github.io/richbiotech-graphic-dashboard/`. Confirm the remote before pushing. Keep the initial HTML below 640,000 bytes.
- Record the build, tested scope, results, and any unverified scope in a release verification note. Passing tests reduce known risks; they do not establish that every future network/device condition is impossible.
