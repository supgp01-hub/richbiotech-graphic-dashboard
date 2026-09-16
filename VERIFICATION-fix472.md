# fix472 — employee evidence-only controls

For deductions imported from Google Sheets, employee views now render only the evidence link. The source-row link is omitted from the employee HTML. Supervisor, Specialist and Audit retain both links, based on the authenticated role. The existing layout places the remaining evidence button at the right of its section. Deduction data, evidence destinations and manager controls are unchanged.

Validation on 16 September 2026:

- 122/122 regression scripts passed.
- All 12 required isolated browser suites, including navigation, Audit save/reload, review rounds, cross-device sync, recovery, imports, release updates, adjustments, calendar and evidence links.
- Evidence tests verify a separate employee session has exactly one evidence-section link and no rendered source URL or administrative buttons; Supervisor, Specialist and Audit retain the source link. Existing coverage continues to check all 12 evidence targets, legacy IDs/financial history, concurrency and failed-sync retries. The employee screenshot was inspected.
- Initial HTML remains 637,716 bytes. No database rules, financial data or production test records changed.

Delivery verification: GitHub CI/Pages and public build/asset hashes. Further signed-in production browser inspection remains unavailable following the previous automatic approval rejection for exhausted workspace credits; isolated role tests must not be described as checking every physical employee device.
