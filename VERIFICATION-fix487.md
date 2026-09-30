# fix487 — One MOSS employee label

MOS, MOSS, Moss and มอส resolve to the same login-directory identity and display as MOSS. Employee labels in tables, selects and owner summaries use MOSS. Legacy option values and stored employee keys remain intact, so orders, audit history and deductions do not require a destructive account/data migration. Editable free text, URLs, scripts and stored records are not rewritten.

Validation: 131/131 regression scripts; 20/20 browser suites after correcting date-dependent fixtures; additional mobile cross-device suite passed. The first browser run had three failures in September ledger fixtures after the current date crossed the cutoff. These fixtures now use a fixed September clock; all original financial and permission assertions remain, and each failed suite passed on rerun. The ledger unit fixture clock is fixed for the same reason.

The Specialist submission browser test now asserts MOSS in the rendered audit queue while the legacy persisted assignee remains MOS. Existing initial submission, correction cycles, evidence, approval and reload checks pass. Display tests also check option values and freeform data are unchanged.

Production read-only inspection confirmed GR460 and GR432 are assigned MOS and inprogress; GR432 is a personal test. No real job status, account credentials, permissions, evidence, or money was changed. Actual failed submission from MOSS's own signed-in session has not been reproduced; name unification alone is not evidence that the separately reported submission symptom is resolved.

HTML is 639873 bytes. Public build/asset and signed-in UI verification will be recorded in the private deployment receipt.
