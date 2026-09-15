# fix455 — shared online state and client updates

Reported: employee devices display different releases and reverting statuses, including a screenshot with 106 conflicted operations.

Changes:
- Compare order changes using Firebase value semantics, excluding cache and transport metadata. Saving one work item does not queue unrelated rows.
- Rebase a subsequent in-flight edit on the preceding acknowledged write. Retain real overlapping conflicts; retry only when recorded field baselines prove independence. Cache-only legacy patches need no server write.
- Apply complete online records instead of retaining locally stale cleared fields. Reject out-of-order server revisions within a session. Keep separate evidence caches and pending user operations.
- Stop automatic uploading of historical local work during initial cloud reads. Preserve local data when cloud reads fail, with an explicit unconfirmed state.
- Read from the server if the stream/leader is silent; separate devices receive updates without manual refresh.
- Add a no-cache release manifest check. Idle clients reload newer builds; edited forms, selected files and queued work delay reload. Limit retries when a stale CDN serves an older HTML file.
- Show build and per-device online diagnostic reports in system health for supervisors; correct conflict-review queue exports. Reports contain field names/statuses, not work text or credentials.

Verification:
- Full regression: 110/110 scripts passed with external network disabled; focused checks repeated after the final update guard adjustment.
- Isolated Chrome: full navigation smoke, Audit persistence and stale forms, review-round lifecycle, and independent employee/Audit cross-device suite.
- Cross-device suite: offline submission/reconnection, automatic propagation both ways, 106 unrelated jobs unchanged, consecutive in-flight edits, online field deletion, reload, update deferral with an open form.
- CI includes the cross-device suite for subsequent releases; release manifest/build consistency is tested.

Limitations: physical employee devices have not been directly operated. Pre-fix455 pages have no update checker until they load the new release once. Genuine legacy conflicts and unique draft data are preserved, not forced over current server records. Production diagnostics and public deployment checks follow publishing. No synthetic jobs or Audit decisions are written to production.
