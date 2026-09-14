# fix451 verification — 14 September 2026

## Change

List Content previously treated a localStorage quota exception during draft cleanup as an online save failure, even after the server write and readback had succeeded. Cleanup now cannot invalidate the online acknowledgement. An empty draft key is removed instead of rewritten. Unsent text survives reopening the modal in the same page, storage failure is accurately labelled, and old drafts matching verified online text are reconciled without duplicate writes.

## Completed checks

- 105/105 top-level regression scripts passed with network disabled. These include executable behavior tests and static contracts; this count is not a claim of 105 complete production workflows.
- Coverage includes order creation, planner assignees, acceptance/submission/review, separate HOOK bindings, List Content, queue retries, cross-tab changes, permissions, dropdown controls, Facebook Pages, List Facebook, commissions, deductions, leave, special work, identity-card saves, and shared persistence.
- New regression reproduces quota exhaustion before typing and after online acknowledgement, two-HOOK partial failure and retry, stale draft recovery, editing while a save is in flight, failed readback, and the actual order modal completion function. Firebase responses are mocked for these failure scenarios.
- 28 inline scripts and 55 script snippets compile; all 55 local script references exist. HTML is 639,737 bytes, below the 640,000-byte limit.
- Chrome smoke test passed using local assets and mocked authentication/backend: five sidebar destinations, eight Graphic panels, health panel, commission view switching, and enabled Supervisor new-order action. No JavaScript errors recorded. External services are blocked or explicitly mocked.
- Signed-in production Supervisor UI: all eight Graphic tabs opened; order GR276 displayed as pending review with two ad links. Combined links displayed 2,442 rows; Facebook Pages displayed 203 pages; List Facebook displayed 1,015 accounts. These are observations at test time, not fixed expected totals.

## Ongoing release checks

`tests/run-regression.cjs` discovers and runs all top-level regression scripts, fails on errors/timeouts, and optionally writes a JSON report. `.github/workflows/regression.yml` runs it on pushes and pull requests. `AGENTS.md` requires the complete regression suite, browser smoke, and production verification before delivery. The workflow detects regressions; branch protection / GitHub Pages deployment gating has not been configured by this change.

## Scope limits

Production checks used the currently signed-in Supervisor account. New writes, forced offline/quota conditions, and other role scenarios were tested with isolated fixtures, not by modifying employee work. Unsaved text cannot survive a page reload if browser draft storage is unavailable; the UI now explicitly warns about this instead of claiming that the draft is stored. No guarantee is made that every future device or network failure is impossible.
