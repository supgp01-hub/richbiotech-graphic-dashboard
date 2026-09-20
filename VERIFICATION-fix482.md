# fix482 — mobile navigation and compact working screens

Mobile users could not easily reach order/planning actions, had excessively tall table cards, and saw low-contrast oversized commission headers. The approved mobile preview is applied to the existing application and live handlers, without replacing business data or changing permissions.

## Changes

- Five mobile destinations: Home, Work, Content, Leave and a complete menu. Existing navigation handlers remain responsible for page initialization. First-visit shortcuts wait for the lazy Graphic panel to mount. Supervisor planning/settings and Ads-only access retain their existing boundaries.
- Move the original new-order/planner controls above statistics on mobile; restore their original positions on desktop. Pending animation frames cannot move them back after leaving the mobile breakpoint.
- Collapsible order filters preserve the original inputs, values and handlers. Compact order cards show ID/status, full-width title, deadline, assignee, actions and review counts without overlapping fields.
- Content cards prioritize title/HOOK and group links; existing inline submissions and history remain directly below their item. Commission rankings become readable rows, with compact neutral headers and sufficient contrast. Facebook page names/statuses, account fields, identity forms, calendar modes and other existing responsive views remain available.
- Retain 16 px editable fields, touch targets, safe-area and keyboard handling. Planner body padding no longer inherits the main-page spacing; transient feedback appears above bottom navigation.
- Return from a suspended hidden tab now invokes the same guarded, throttled independent recovery services as bfcache restoration. Existing queues, account isolation, conflict handling and online acknowledgement remain authoritative. No new optimistic success claims or forced reloads.
- Versioned assets, HTML and release manifest use fix482. Initial HTML remains 638,651 bytes. No backend schema, Firebase rules or production record migration.

## Verification

- Full 129-script regression runner with network disabled; extended session-resume coverage verifies background return, duplicate visible events, offline/auth guards, independent failed services and preservation of drafts/queued edits.
- All 17 browser suites in CI, including the new five-role mobile navigation suite, plus the cross-device suite repeated with a touch-enabled mobile viewport.
- Existing mobile workspace coverage checks 320/390/430/760/844/900 px, five primary screens/eight Graphic panels, nested Content history, form retention, bfcache/reconnect, calendar modes, dark theme and desktop restoration. Navigation tests use the real new mobile menu rather than hidden desktop buttons.
- New navigation coverage checks Supervisor/Graphic/Specialist/Audit/Ads menus, first-visit shortcuts, order/planner openings, compact card geometry, collapsible filters, commission header height and mobile-to-desktop-to-mobile restoration.
- Local screenshots/reports and the post-deployment receipt remain outside Git. Public build/assets, GitHub Pages/CI and signed-in production inspection are checked after publishing.

## Limits

Tests use isolated data and Chrome touch/viewport emulation; they do not establish physical iPhone/Safari, Android keyboard, or embedded LINE/Facebook browser behavior. No employee production tasks were used as write fixtures. The site remains a web application: mobile operating systems can suspend background execution, and the recovery path runs when the page returns. These checks reduce known failures but cannot guarantee uninterrupted service under every device/network condition.
