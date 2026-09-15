# fix466 — recurring Thai holiday years

The calendar now computes annual holidays for the selected year rather than returning empty holidays outside 2569. A compact Buddhist Era year input changes the existing monthly calendar directly. Verified 2026 dates retain precedence, including the exceptional Bangkok-only date and corrected Royal Ploughing date.

The separate dependency-free engine calculates fixed holidays, Thai lunisolar full moons, Khao Phansa, government substitute days and December-to-January substitutes. Two holidays on the same date display both names. Year-specific special days and Royal Ploughing are not copied to other years. Calculated years are labeled as calculated and the notice explains that special-day announcements remain required. Dates are bundled identically for all devices; no external calendar service or business data writes are introduced.

The selector accepts CE 1600–9998 (BE 2143–10541). Structural coverage is not a guarantee of historical legal policy or future official declarations: upstream lunar validation is roughly CE 1900–2050, and dates outside that range are projections. Sources, calculation policy and MIT attribution are documented in `docs/thai-holidays-2569.md` and `docs/thai-calendar-LICENSE.txt`.

Validation on 15 September 2026:

- 121/121 regression scripts passed with external network disabled.
- All 11 browser suites passed: whole-app smoke, audit persistence, review rounds, independent-browser sync, auth recovery, conflict recovery, content inline, automatic updates, append import, deduction adjustments and holiday calendar.
- Independent published lunar fixtures for 2024–2026; four lunar holidays each year across 1900–2200; valid Gregorian dates, weekday substitutes, cross-year boundaries, coincident holidays and bounded cache.
- Real calendar fixture: direct year input 2570/2571, lunar dates and substitutes, preserved staff/ribbons, date modal, toggle, mobile and dark layout. Screenshots inspected.
- Initial HTML 637,648 bytes, below 640,000. No database rule changes or production test writes.

After push: verify public asset hashes, GitHub CI/Pages success and signed-in online year selection. Physical employee devices are not individually tested.
