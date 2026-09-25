# fix485 — Specialist regular order creation

Specialist accounts now see the existing เพิ่มงานใหม่ action on desktop and mobile. The authenticated profile applies a Specialist-specific class, cleared on logout or signed-out state, so existing non-supervisor hiding does not suppress this one action. The existing form, assignee selection, validation, confirmation and durable saves are reused. Planner and administrative actions retain their existing restrictions.

Validation: 130 regression scripts; 19 browser suites; mobile navigation verifies regular creation access for Specialist at 390px and 1280px and preserves other role boundaries; a stateful isolated test creates a regular assignment as Specialist, checks its assignee and non-personal identity, and reloads the saved order. Authentication fixture updated with a DOM class-list stub for the signed-out cleanup. No production records created for tests; no database rule changes. Physical phones and every employee account have not been directly tested.

Build fix485. Before delivery: compare public assets, confirm Pages/CI success, inspect the signed-in production UI.
