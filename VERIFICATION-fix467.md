# fix467 — compact team calendar toolbar

The calendar's tall capacity cards, success banner and always-visible filters are replaced by the approved compact toolbar. The selected date, working/away/available counts, deadlines and capacity status remain visible. Filters expand on demand, retain their selection across calendar renders, show an active count, reset together and close with Escape. Actual deadline conflicts and tomorrow's leave notices remain visible.

The month navigation, existing leave legend and holiday toggle share a toolbar. The information button exposes the existing year selector and holiday source/calculation note. The today action still opens today's editable details. Employee records, holiday calculations, save paths, permissions and synchronization behavior are unchanged.

Validation, 15 September 2026:

- 121 regression scripts, external network disabled.
- Eleven isolated browser suites: whole-app navigation, Audit persistence, revision rounds, independent-device synchronization, session restoration, conflict recovery, inline content, automatic releases, append imports, deduction adjustments and the holiday calendar.
- Calendar coverage extended for collapsed/expanded filters, active counts, reset, Escape, persistence through render, desktop single-row and mobile two-row summary, and visible deadline conflict alerts with filters closed. Existing holiday, date dialog, dark/mobile and multi-year guarantees retained.
- Desktop and mobile screenshots inspected. HTML remains 637,648 bytes. Changed asset versions and release.json use fix467.

Production delivery requires successful CI/Pages, matching public assets and signed-in UI verification. Local browser scenarios use isolated fixtures rather than real employee writes. Individual physical employee devices are not separately tested.
