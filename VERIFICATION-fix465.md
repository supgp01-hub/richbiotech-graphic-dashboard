# fix465 — quiet Thai holiday calendar

Adds the approved faint lower-right holiday illustrations and readable Thai labels to the existing team month calendar, with a visibility switch. Staff names, colors, special-work ribbons and date dialogs retain their behavior. The annotations reserve their own space; narrow screens can scroll the calendar horizontally. Light and dark themes are supported.

Dates are bundled with the release for all clients. The verified dataset covers 2569 (2026), including the corrected 13 May Royal Ploughing date, substitute holidays and a clearly labeled Bangkok-only 16 October. Other years explicitly report unavailable verified data. Sources and update guidance are in `docs/thai-holidays-2569.md`.

No business records, database rules, employee leave, capacity, deadline or deduction policy were changed. The only browser storage is a small optional display preference; storage failure does not prevent calendar use. Rendering is called from the existing calendar render path, without polling or a mutation observer.

Local validation, 15 September 2026:

- 120/120 regression scripts passed, with external network disabled.
- All 11 required browser suites passed: full-functional smoke, audit persistence, review rounds, cross-device sync, auth recovery, conflict recovery, inline content, automatic releases, append import, audit adjustments, and the new holiday calendar.
- New calendar coverage: 3 staff and WFH in a holiday cell, non-overlapping labels, unchanged staff, toggle and storage exhaustion, date dialog open/close, month and year navigation, absent/withdrawn dates, Bangkok scope, desktop/mobile and dark theme.
- Desktop and mobile screenshots visually inspected. Initial HTML 637,578 bytes, below the 640,000-byte limit.
- New browser suite added to CI and release requirements.

Production follow-up: confirm CI/Pages, public build and asset hashes, then inspect the signed-in calendar after deployment. Local browser cases use isolated fixtures; no production employee work is used for test saves. Physical employee devices and every possible network condition are not covered.
