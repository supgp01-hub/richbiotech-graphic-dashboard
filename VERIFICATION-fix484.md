# fix484 — Mobile capsule navigation and personal-work access

Replaces the five bottom-navigation glyphs with consistent rounded vector icons and a floating translucent capsule with an inset selected state and safe-area spacing. Existing navigation handlers and destinations remain in use.

Fixes mobile personal-work access: the non-supervisor CSS previously hid the entire actions container, including the authorized personal-work button. Now only supervisor assignment/planner controls are hidden for employees. Graphic, Specialist and Supervisor can open personal work from the visible button. Audit and Ads opt retain their existing permissions; this change does not expand account access.

Validation: full 130-script regression, 18 browser suites, additional mobile cross-device flow. Extended mobile navigation tests click the actual personal-work button for all three authorized roles, check enabled fields, preserve supervisor-only actions and Ads opt boundaries, verify five SVG icons and capsule geometry. Existing personal-work browser flow covers draft/save, offline retry, two campaign versions, independent Audit review, evidence correction and approval. Inspected mobile screenshot. No production records created for testing. No backend rules, workflow or deduction policy changes. Physical phones and each employee's real account are not directly tested.

Build: fix484. Deployment checks: public asset hashes, GitHub Pages/CI, signed-in live UI.
