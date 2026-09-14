# fix452 — preserve Audit edits across realtime updates

## Problem and change

Reproduced in an isolated full dashboard browser: an Audit modal opened before an online update wrote its untouched old Facebook name and campaign over the newer record when the correction button was clicked. The record cache had refreshed but the form had not; diffing against that refreshed cache treated stale fields as deliberate edits.

- Capture the hydrated Audit form baseline and submit only edited fields. Use the original field values for conditional writes, even if the order timestamp has refreshed meanwhile.
- Reject conflicting field edits while retaining the entered text and queued operation. Rebase the form only after an online acknowledgement, without swallowing edits typed during the save.
- Normal employee saves preserve Audit-owned fields and version decisions. A stale employee status action or stale correction evidence cannot replace a newer Audit decision.
- Reopening a job removes old rendered version cards and rebuilds from the current order.

## Validation before release

- `tests/run-regression.cjs`: **106/106 passed**, with external network disabled. Includes storage quota, offline queues/retries, independent field merges, partial saves, roles, and the new stale Audit form regression.
- `tests/manual/audit-persistence452.e2e.cjs`: passed against local assets and stateful mocked Firebase with conditional ETags. Real Audit and employee button handlers: save two campaigns, reload, preserve newer untouched fields, stop a stale employee action, deliberately resubmit a corrected link while retaining Audit details. The stale-field assertion failed on fix451 before the fix.
- `tests/manual/full-functional-smoke.e2e.js`: passed five sidebar destinations, eight Graphic panels, health panel, commission view switch and new-order button.
- JavaScript compilation and script asset integrity passed in the regression suite; HTML remains below 640,000 bytes.
- CI now runs the stateful Audit browser regression and navigation smoke in addition to the offline regression suite.

## Production investigation and limits

Read-only snapshot: 222 active orders. Examined 800 available history events spanning 12–14 September. GR264–GR266 retained Audit fields online and had later employee revision submissions explaining their return to review. GR227 was subsequently marked complete by the Supervisor; the examined history did not contain the missing filled fields needed for a reliable restoration. No production order status or Audit text was invented or changed during this investigation.

This reproduces and fixes a concrete overwrite path; it does not establish the historical cause of every screenshot. Tests used isolated accounts/backends, not every real employee account or device. Production delivery is verified separately by public build/assets and signed-in read-only UI inspection. CI does not currently gate GitHub Pages publishing through branch protection.
