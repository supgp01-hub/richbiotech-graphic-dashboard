# fix508 — Hover-only photo remove controls

Audit evidence thumbnails and ID-card photo previews now use a circular X at the top right. Desktop hover and keyboard focus reveal it; touch devices keep it visible. Existing handlers, role-based creation of buttons, and record-delete controls remain unchanged. The general edit/delete icon decorator excludes these photo controls so it cannot replace the X with a trash icon or move it into normal flow.

Validation before push:
- 142/142 regression scripts passed.
- All 26 distinct required browser suites passed (runner executed ID-card coverage twice, 27 successful invocations).
- Extended ID-card browser coverage verifies no uploads on read, top-right geometry, hover/focus visibility, circular X, existing remove handler, Audit thumbnail handler preservation, and visible 36px touch control with a 44px effective target.
- Targeted test rerun after final CSS specificity/hidden-state adjustments passed.
- Inspected the synthetic screenshot; no real ID photos or production records were modified for testing.
- HTML remains 639965 bytes, below 640000.

Production deployment and signed-in read-only checks follow push. No claim of testing deletion on real employee evidence or identity documents.
