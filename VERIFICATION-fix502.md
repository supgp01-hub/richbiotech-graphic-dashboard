# fix502 — Single initial HOOK/version and aligned form fields

## Changes
- Supervisor, employee and additional-job editors initially show HOOK 1. Add HOOK reveals the next field; populated legacy slots and content source IDs remain compatible.
- Audit starts with campaign/LINK VER 1. Add campaign reveals VER 2 before creating extra versions. Saved campaign data, submitted links and owned audit evidence retain their version numbers.
- Reset expansion when opening a different work item, including a new item after editing a multi-version job.
- Equal two-column widths, 40 px desktop fields, aligned labels, 46 px touch fields and stacked mobile columns. Campaign removal stays inside the link area without reducing its width.
- No database schema, permissions or workflow status-transition changes.

## Verification
- 139/139 regression scripts passed.
- All 23 existing workflow browser suites passed. The cross-device failure from the initial implementation was fixed and the full suite rerun successfully.
- New single-hook502 browser suite passed: single initial slots, explicit additions, equal desktop dimensions, mobile remove-button alignment, saved VER 2/3 readback, new-job reset and employee parity. Added to CI.
- Additional mobile cross-device suite passed: offline retry, automatic refresh, concurrent edits, server clears, reload and update deferral.
- Local screenshots reviewed for new-job and audit forms; transport tests use isolated mocked accounts/data, never production work.
- HTML: 639,952 bytes; HTML build and release.json both fix502. Changed runtime/style references cache-busted.
- Public deployment/assets are checked after push; local verification outputs are stored outside the repository. Browser inspection of the existing signed-in tab was unavailable before deployment because its page-evaluation calls timed out; this is not a claim of successful production submission testing.
