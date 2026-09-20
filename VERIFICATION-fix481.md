# fix481 — mobile workspace and restored-session recovery

The mobile shell previously concealed horizontal overflow while the calendar, organization chart, Content Tracker, commission and account tables retained desktop minimum widths. Mobile users had to pan within these sections. A `pagehide` also stopped order streaming and released tab leadership, but a persisted `pageshow` had no matching recovery handler.

## Changes

- Responsive card presentation through 900 px using the existing table DOM and event handlers, with source-column labels. Hidden rows/cells retain their visibility rules. Content cards use two columns for short fields and full-width title/HOOK fields.
- Organization chart wraps; the calendar fits seven columns and offers a daily-list view. Activity ribbons stack below the date on mobile, remaining beside it on desktop. Holidays, employee chips and edit actions are retained.
- Larger form text and touch controls, safe-area padding and keyboard-aware dialog height/bottom navigation. Pinch zoom remains available. Desktop layouts are preserved.
- Persisted page restoration reclaims leadership, retries existing queues and reads current server data. Each service failure is isolated. It never clears drafts, forces a reload, bypasses authentication or marks unacknowledged writes successful.
- Build and release manifest are fix481; new assets have versioned URLs. No business schema, permissions, Firebase rules or production records are changed.

## Validation

- 129 regression scripts, including restored-session lifecycle, failed independent queues, offline/auth guards, duplicate events and draft retention.
- All 15 established browser suites, the new mobile workspace suite, and the independent employee/Audit cross-device suite repeated with a touch-enabled 390 × 844 viewport (17 runs total).
- New mobile suite: populated data at widths 320, 390, 430, 760, 844 and 900; all five primary destinations and eight Graphic panels; nested Content history; native controls and dropdown sheet; retained account form through restored-page/reconnect events; calendar month/list modes, holiday/staff layout, dark theme and desktop restoration.
- Existing cross-device tests cover real browser-context offline/retry, ETag concurrent edits, separate employee/Audit reads, server clears, unrelated records, reload and safe release deferral. Existing storage quota, partial-save, permissions and identity tests remain enabled.
- Calendar geometry assertions now require stacked mobile activities rather than a desktop-style side-by-side strip. Non-overlap, complete labels, staff preservation and desktop alignment assertions remain intact.
- Local screenshots and test reports stay outside Git. Signed-in production inspection, public asset hashes, Pages and CI results are recorded in the private fix481 deployment receipt after publishing.

## Limits

Mobile verification uses Chrome touch/viewport emulation and isolated backend fixtures; it does not establish physical iPhone/Safari, Android keyboard, embedded LINE/Facebook browser or carrier-network behavior. The user's specific phone/browser and failure sequence have not been supplied. The page-restoration gap is confirmed in code and tests, but it cannot establish the sole cause of every reported mobile connectivity interruption.

The site remains a responsive web application. The browser/OS may suspend it in the background; this release restores connectivity on return and retains existing save/retry protections rather than promising continuous background execution.
