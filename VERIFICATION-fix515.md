# fix515 — switches for all six deduction rules

Prepared, not deployed: Firebase CLI credentials require reauthentication before database rules can be published. Do not push production HTML until the database rules are deployed and verified.

Adds Supervisor/Audit switches and employee read-only status for all six rules. State is stored in a separate append-only online history with server timestamps and validated actor identity. Writes require online acknowledgment; operation IDs preserve idempotency after lost acknowledgments. Stale state is refreshed rather than silently overwriting another device. A failed settings read stops new generated deductions.

Paused rules exclude new calculated rows and matching newly imported sheet rows; recorded manual entries, imported history, decisions and adjustments remain. Re-enabling uses the new activation time as the due-date cutoff, without backfilling old deadlines. Unknown explicit sheet categories are not reclassified. The active-rules panel reflects the enabled set. Existing ledger write APIs are unchanged.

Validation:
- Final full regression: 145/145 passed (../regression515-final.json).
- Required browser runner: 25/27 initial invocations passed. Audit inline focus and audit persistence checks failed initially; repeated unchanged assertions passed after avoiding needless ledger redraw on unchanged settings reads. All 26 distinct pre-existing suites passed across these runs.
- New browser suite passed: six switches; Supervisor/Audit across independent devices; employee read-only; offline handling; lost-ack retry; stale change detection; reload; re-enable cutoff. Mobile screenshot inspected.
- Separate mobile cross-device suite passed.
- Local database emulator: permitted roles, denied employee/disabled/anonymous writes, allowed reads, boolean validation, server timestamps, actor identity, immutable history and invalid-rule denial passed.
- git diff --check passed. Initial HTML 639334 bytes; release.json and rb-build agree on fix515.

The first regression run had one unrelated Facebook Pages rendering timeout; complete subsequent runs passed. No assertions were removed. No production records were modified in tests. Production assets and UI remain unverified until deployment. Deployment helper checks that only the new rules subtree differs from current server permissions.
