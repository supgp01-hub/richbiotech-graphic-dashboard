# fix505 — Audit editing on employee ID-card page

Audit was admitted only through a synchronous temporary Graphic-role wrapper. The asynchronous cloud callback and later renders evaluated the original edit guard with the Audit role and disabled the fields. Add Audit to the native ID-card edit guard and remove Audit from the temporary-role workaround. Keep record deletion restricted to Supervisor/Specialist and retain the existing shared-record backend path and database/storage rules.

Validation: 141/141 regression scripts; 24/24 existing browser suites; new idcard-audit505 browser suite (delayed cloud read, real UI phase/status edits, persisted per-record writes, rerender and independent fresh-session readback, no delete control or role mutation); additional mobile cross-device suite passed. Test backend contains synthetic data only. HTML 639965 bytes. Test screenshot reviewed.

Production build/assets will be verified after deployment. No real ID-card records were modified. Audit-account production edit/save is not claimed from mocked tests.
