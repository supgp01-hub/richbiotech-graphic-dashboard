# fix491 — Shared import history

The CSV dialog now reads import history from the authoritative content snapshot instead of the browser-only history cache. New batches embed one receipt in their imported rows; the ETag-protected content writer merges the receipt into `content_tracker_v2.importHistory` in the same write as the content. Existing remote receipts are retained across appends, concurrent-batch retries and deletion of rows. No separate database permissions or submission schema is changed.

Older batches are reconstructed from `importBatch` labels on surviving online rows. These are explicitly labeled recovered: counts represent surviving rows, and times inferred from original row IDs may be incomplete. Browser-only history is not presented as current shared history. An offline read shows a freshness warning; pending batches cannot claim online success. Undo is offered only when the current browser holds the undo receipt for the latest confirmed batch.

Validation: 134/134 regression scripts, 20/20 required browser workflows, and mobile cross-device checks passed. Added behavioral coverage for cloud recovery, exhausted local storage, offline/retry, lost acknowledgements, concurrent batch preservation, removal, escaping and role guards. The real CSV browser scenario verifies the receipt is visible from an independent browser even when local history writes fail. Existing tests were updated for the new accurate acknowledgement wording while retaining content/count guarantees.

Production verification is read-only. No real content is imported or rolled back for testing. Recovered history cannot restore details that are absent from both stored content and receipts. Physical-phone testing is not performed. Initial HTML: 639,936 bytes.
