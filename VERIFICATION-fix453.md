# fix453 — review rounds and correction submission history

## Behavior

- Order rows show the numbered review, correction submission count, and a history button. Home work lists, team inbox and review notifications use the same status labels. Existing status values and filters remain unchanged.
- The first employee submission is review 1. Each Audit correction cycle has one identifier; a submission containing multiple HOOKs/VERs advances the review once. Duplicate clicks and queue retries reuse the cycle. Changing a status through bulk editing does not fabricate an employee submission.
- The per-VER submit button disappears after a successful submission; the handler also rejects repeat submissions while the order is already waiting for review.
- The cycle ledger, status and revision history use the existing conditional ETag write as one order update. No separate history write can succeed while its corresponding status fails. Pending rows show that online confirmation is outstanding; the render cache refreshes when the queue clears even if the order fields are unchanged.
- The history dialog shows actor, time, Audit notes, VER numbers and safe work links. Employee access follows order ownership, and changing role closes an unauthorized open history.
- Existing records are read without a migration. Only sequences with a recorded first submission and linked correction cycles receive a numbered legacy review; incomplete sequences are marked unconfirmed. Known repeated legacy submissions after the same Audit request are grouped. Older entries lacking a cycle remain visible as recorded history, not a claim of a complete count.

## Validation

- `node tests/run-regression.cjs`: 107/107 scripts passed with external network disabled. Includes quota exhaustion, queues, retries, partial saves, roles, concurrent edits and stale Audit forms.
- `tests/order-review-rounds453.test.cjs`: first submission, two correction rounds, both HOOKs in one cycle, duplicate attempts, approval, reload, legacy gaps, bulk status changes, role restrictions, escaped history, offline transport, lost acknowledgement retry and conflicting online ledger writes.
- `tests/manual/review-rounds453.e2e.cjs`: passed real page handlers against isolated stateful Firebase/ETag transport. Initial submission, Audit decisions, general employee submission, per-VER image uploads/submission, repeat guard, numbered table, history dialog, approval and reload. Six conditional order writes.
- `tests/manual/audit-persistence452.e2e.cjs`: passed Audit save/reload, stale metadata protection, stale worker action rejection, and deliberate employee resubmission retaining Audit data.
- `tests/manual/full-functional-smoke.e2e.js`: passed five sidebar destinations, eight Graphic panels, online health, commission view switch and new-order button.
- JavaScript compilation and asset integrity passed. Initial HTML is 635,544 bytes with LF enforced for consistent Windows/Linux size.
- CI runs all three isolated browser suites and the complete regression runner.

## Delivery limits

No production job was submitted, approved or changed to create test data. Production verification uses the published build/assets and signed-in read-only UI after deployment. These results do not claim that every real employee device or every future network condition has been tested. Older clients must reload to use the cycle-aware submit guard; historical gaps cannot be reconstructed into a guaranteed full count.
