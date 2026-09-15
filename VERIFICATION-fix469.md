# fix469 — activity badges beside calendar dates

WFH, office, training and outing badges now share a heading with the date number, matching the marked reference. Multiple activity categories stack within the right column; normal document flow keeps staff and holiday annotations below the heading. Existing date badges, filters, holiday calculations, date-dialog actions and data persistence are retained.

Validation on 15 September 2026:

- Full regression runner: 121 scripts. The obsolete assertion requiring activities above the date was updated to the approved shared heading; browser geometry assertions verify the actual layout.
- All 11 isolated browser suites, including whole-app smoke, Audit persistence, revision rounds, cross-device sync, authentication recovery, conflict recovery, content history, automatic updates, append imports, deduction adjustments and calendar behavior.
- Calendar coverage includes one activity beside a normal date and four activities beside a decorated date, at desktop and mobile widths and in dark mode. Checks reject date/label overlap, clipped labels, overflow and overlap with staff/holiday content. Desktop/mobile screenshots inspected.
- Initial HTML remains 637,648 bytes. No database rule, schema or save-path changes; no production test records.

Delivery checks: public build/assets, GitHub CI/Pages success and signed-in production calendar. Physical employee devices are not individually tested.
