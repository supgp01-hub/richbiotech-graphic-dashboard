# fix475 — Facebook Pages notification dropdown and full-page layout

Facebook Pages opens with all matching pages on one continuous document. The optional 50/100/200 selector still works and can return to All. Full page names, creator accounts and shareable accounts wrap within the available width. Narrow screens use labeled stacked rows without an internal horizontal or vertical table scrollbar.

The notification column now offers the existing three states. New selections use stable page keys in `/workflow_snapshots/fbpage_notifications_v1/<page-key>` so duplicate names and renamed pages retain independent status. Existing name-based notifications remain a read-only fallback. Reset is an explicit empty value, preventing the old status from reappearing. Existing active-team permissions are retained; database rules are unchanged.

Writes use authenticated requests directly and require the server response to match the value and timestamp before reporting online success. This deliberately avoids the legacy durable queue's early success return. Failed/offline selections remain visible with retry, account changes clear transient state, and stale reads cannot undo a more recent save. Active pages refresh every 30 seconds and on focus/reconnect. Unchanged reads retain the current dropdown DOM. Drafts and in-flight saves block automatic release reload even after changing tabs; closing a page with a pending selection warns about unsaved changes.

Verified 19 September 2026:

- 125/125 regression scripts passed, including new notification acknowledgement, quota exhaustion, offline/retry, independent concurrent rows, duplicate names, explicit resets, stale reads and role/account boundaries.
- 13 existing required browser suites passed across navigation, orders, Audit, revisions, deductions, imports, recovery, updates and holidays.
- New Facebook Pages browser suite passed with 206 fictional records, full names/metadata, all/50 pagination, search/reset, two isolated employee/Supervisor browsers, failed writes/retry, reset/reload, widths 1280/900/760/390, dark/light layout and no runtime errors.
- HTML and release.json agree on fix475; initial HTML is 637,961 bytes, below the 640,000-byte limit. Changed assets have versioned URLs.

Production delivery requires successful Pages/CI, public asset comparison, and signed-in read-only UI inspection. Test mutations use isolated fixtures only, never real employee records. These checks do not claim every physical device or future network condition was tested.

Post-deployment CI found a test-only reload timing race: the status assertion read `.value` during a transient table rebuild. The wait predicate now tolerates the absent element while retaining the same expected status. Production assets are unchanged by this follow-up.

Follow-up verification: all 125 regression scripts and all 14 browser suites pass again. The signed-in production page reports fix475, renders 206 rows and 206 enabled notification selectors, defaults to all pages, retains actual page names and Facebook metadata, and fits the 741px viewport without horizontal document overflow. All 37 deployed asset hashes matched the release commit. Production inspection was read-only.
