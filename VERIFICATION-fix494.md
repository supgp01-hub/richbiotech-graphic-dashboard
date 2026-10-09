# Verification — fix494

Request: publish the approved aligned HOOK controls and allow multiple job names in one order, preserving Content Tracker / List Content syncing and the existing submission/audit workflow.

Changes:
- HOOK 1, 2 and added HOOK rows use equal-width controls with an integrated remove action. Job groups form two columns on desktop and stack on mobile.
- Supervisor and employee forms support additional job names with their own HOOK selections. Existing primary fields remain compatible; additional groups are stored in `jobExtra` and source bindings are retained by row ID.
- List Content stays associated with each source row, including identical HOOK text under different job names. Copying HOOK 1 uses the current job group. Ambiguous primary sources cannot borrow another group's binding.
- New-order drafts, order summaries, search and HOOK-history matching include additional job names. Existing status, audit, deduction and permission rules are unchanged.

Validation (2026-10-09):
- 136/136 regression scripts passed after the final functional change.
- New behavioral coverage: source IDs, group removal/renumbering, source refresh, same-job copying, exhausted storage, partial offline retries, concurrent edits, history and account boundaries.
- Dedicated browser coverage passed: supervisor save/reload, independent employee browser, per-row List Content readback, recovery of a draft containing only an additional job name, equal HOOK widths and mobile layout. Desktop/mobile screenshots inspected.
- Existing 21 browser workflows have passing executions. The parallel run passed 20/21; audit-persistence452 timed out on its stale-state message. A retry while the suite was active timed out on navigation. It passed unchanged after the suite ended, including stale-state protection and subsequent revision submission. Initial failures remain in local reports.
- The dedicated new browser test is registered in CI and honors its configured browser channel.
- HTML is 639731 bytes, below 640000. HTML and release manifest both declare fix494.

No production data was used as a test fixture. Physical phones and all real employee accounts were not tested. The signed-in production browser inspection is unavailable because the computer-use Node runtime exits during initialization. Public build/assets and GitHub Pages deployment are verified separately after pushing. Separate mobile cross-device verification passed: offline retry, automatic independent employee/audit refresh, concurrent edits, server clears, reload and release-update deferral.
