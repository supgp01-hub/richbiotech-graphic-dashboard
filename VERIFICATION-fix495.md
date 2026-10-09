# Verification — fix495

Request: implement the approved preview, moving Add job name directly below the name field and matching Add HOOK button dimensions, with more space before Product.

Changes: both supervisor and employee forms mount the existing add-name action under the primary name field. Both add buttons use 112 by 36 px controls (44 px tall on coarse pointers), with 16 px above Add job name and 28 px after the extra-job area. Reopening the supervisor form removes its previous external add button before recreating it. No save payload, workflow, database rule or synchronization behavior changed.

Validation:
- 136/136 regression scripts passed.
- Browser verification includes button dimensions, left alignment and spacing, absence of duplicate buttons on reopening, adding names, save/reload, independent employee reads, List Content source mappings and draft recovery.
- All 22 configured browser workflows passed; separate mobile cross-device verification also passed (offline retry, independent employee/audit refresh, concurrent edits, reload and release-update deferral).
- Desktop and mobile screenshots inspected. HTML remains 639731 bytes, below the 640000-byte limit. HTML and manifest declare fix495.

All workflow tests use isolated fixtures and mocked transport. No production employee data was changed for testing. Physical phones and all real accounts were not tested. Public assets and deployment are checked after pushing; signed-in production UI could not be inspected because the browser runtime exited during initialization (sandbox setup refresh error).
