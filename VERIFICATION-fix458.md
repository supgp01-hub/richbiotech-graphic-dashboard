# fix458 — Recover centrally backed-up employee submissions

JAM's latest fix457 device report reduced 106 queued conflicts to one actual submission. Its central backup contains six GR242 submission links, initial submission metadata and a stale brief. The current server record is in progress with the current supervisor brief and no submission links. Recovery must preserve that brief while restoring submission evidence.

Supervisors can inspect an additive recovery preview against the latest online order. Only absent submission fields are filled. A first submission can enter review only from pending/in-progress with no existing submission or review history. Completed/revision states, assignee changes and deletions are protected. Full original operation and pre-recovery server data remain archived centrally. ETag writes also require the entire preview snapshot to remain unchanged. Failed acknowledgements are retryable without duplicating the order write.

An exact committed receipt retires the original employee operation on the originating account; prepared/failed receipts, other accounts and newly edited operations cannot clear it. A browser test exercises the actual recovery buttons and receipt propagation to an independent employee context, including reload.

Validation: 115/115 regression scripts; six isolated browser suites: full functional navigation, Audit persistence, review rounds, cross-device sync, bounded auth recovery, and central conflict recovery. Recovery tests cover offline failure, concurrent edits, partial success, retry, preservation, account/role boundaries and stale previews. HTML is 636,280 bytes. CI and production asset/UI verification follow deployment.

Production follow-up: recover GR242 through the signed-in supervisor UI and verify the JAM device receipt. TER's last observed source-device report remains old; its queue/evidence cannot yet be declared recovered. No synthetic jobs or arbitrary Audit decisions are used in production tests.
