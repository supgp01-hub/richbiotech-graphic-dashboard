# fix457 — obsolete queue recovery and shared conflict backups

Production diagnostics confirmed large conflict batches where most entries reported no differing business fields, alongside a smaller set of genuine differing submissions. The legacy diagnostic build label was hardcoded and cannot establish the actual client version.

- Archive metadata-only conflicted operations before retiring them. Do not modify the corresponding online order. Use IndexedDB if localStorage is full; retain the queue if neither archive succeeds.
- Preserve real conflicting submissions. Back them up to the existing authenticated database under `workflow_snapshots/order_conflict_backups_v1`, keyed by reporting user and operation token. A backup receipt never changes the workflow status or removes the original conflict.
- Supervisor health UI can read these backups from any signed-in computer. Display work text safely and distinguish snapshot values from current order values. Legacy diagnostic labels no longer pretend to be confirmed client versions.
- Allow release updates with conflict-only queues after a verified durable checkpoint. Still protect open/dirty forms, files and other pending writes. Restore the same operation after reload.
- Initial order loads use an actual online read rather than a generic queue overlay, so cached data cannot be mistaken for a server acknowledgement.

Validation: 114 regression scripts, plus five isolated Chrome suites. The cross-device suite now restores and archives 106 obsolete operations, sends work offline/reconnects, propagates Audit decisions automatically, rebases concurrent edits, retains server clears, and preserves a genuine conflict across a release reload. Cloud backup tests cover failed upload retry, idempotency, original work retention and safe supervisor display.

No production work status or assignee was changed to make a test pass. Physical employee browsers must load the updated client once before their locally held submissions can be backed up and reconciled. Reported genuine conflicts are not declared resolved solely because the code is deployed.
