# fix507 — ID-card load and photo controls

Changed the Supervisor shared-read baseline so migration uploads only missing or changed legacy rows instead of resending every already shared photo on a fresh page. Legacy data remains a migration source. Moved the existing remove-photo button into the preview toolbar, preserving its handler and permissions.

Validation:
- 142/142 regression scripts passed, including a 242-record read with zero redundant writes and missing/newer legacy migration checks.
- Targeted browser check verifies the remove-photo button stays inside the card and opening shared records produces zero uploads.
- Mobile cross-device test passed (offline retry, concurrent edits, clears and reload).
- 26/26 required browser suites passed before push.
- Facebook Pages geometry test now samples a connected, rendered row after reload; all original size/alignment assertions retained.

Production saves and deletes are not exercised against real identity documents. Network transfer of the existing shared/legacy photo collections still depends on connection speed. No claim of a measured end-to-end load-time improvement on every device.
