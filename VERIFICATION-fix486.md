# fix486 — Specialist employee submission workflow

## Problem and change
Specialist opening their own assigned regular order from All work entered the assignment editor. The image-delivery action saved fields without advancing the workflow. Existing own orders now enter the same employee submission mode used by Graphic staff, regardless of the list they were opened from. Assignment matching uses the shared normalized assignee matcher (MOS, MOSS and Thai มอส). New-order creation and editing assignments for other employees remain available. Added MOS alias to per-version correction ownership matching.

## Verification
- The new Specialist browser regression fails against the prior modal-mode condition: expected Send work, received Save work.
- Stateful isolated-browser coverage: MOS/MOSS/มอส ownership, another employee boundary, first submission through delivery tab, two correction cycles through both submit paths, evidence preservation, duplicate prevention, Audit queue/history, approval and reload.
- Full regression suite and required browser suites must pass before push; final results recorded in the private release receipt.
- No database schema, permissions, deduction policy, or existing production job data changed. Uses the existing evidence, online acknowledgement, conflict and retry workflow.

## Scope limits
No real MOSS login or physical phone was used for test saves. Production checks are read-only under the existing signed-in account. Already-stuck records are not bulk-reclassified based only on the presence of links; the employee can open and submit them through the corrected workflow.

Final local results: 130/130 regression scripts, 20/20 browser suites, and additional mobile cross-device suite passed. HTML 639803 bytes. An outdated source-string assertion was replaced by evaluating the actual mode expression for new-order and own/other-role cases; the original new-order guarantee remains covered.
