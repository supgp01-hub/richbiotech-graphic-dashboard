# Verification — fix493

Request: show the HOOK order-history button to all signed-in users who can already access Content Tracker. The owner explicitly confirmed preserving existing page access, including the Ads Optimizer navigation restriction.

Changes: history read access now accepts authenticated active users with supported roles. Removed the VIEW-only history subtitle. Existing VIEW-specific deadline column/warnings and all master-data write permissions remain unchanged. No database rules, submission schema, or data writes changed.

Validation (2026-10-09):
- 135/135 regression scripts passed.
- Existing history DOM test passed, including logout hiding/closing.
- Dedicated browser test passed for Supervisor, Specialist, Graphic and Audit: button, open, search, details and close. Graphic mobile layout inspected. Ads history guard accepts the role while existing restricted navigation is retained. Graphic/Ads master-edit restrictions retained.
- Existing 20 browser workflows: 19 passed in parallel; audit-persistence452 hit its stale-state message timeout under concurrent load, then passed unchanged when run independently, including no stale write and subsequent revision submission. All 20 therefore have passing executions; initial timeout retained in the local report.
- Separate mobile cross-device test passed.
- HTML 639597 bytes; HTML/manifest build fix493. Added role browser test to CI.

No production data was used as a test fixture or edited. Physical phones and all real accounts were not tested. The signed-in production browser check is unavailable: the computer-use Node runtime exited unexpectedly on repeated initialization. Public assets and GitHub deployment are checked separately after pushing.
