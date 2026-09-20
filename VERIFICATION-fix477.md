# fix477 — Employee and product dropdowns in the Facebook account modal

The Add Facebook Account modal now uses dropdowns for employee and product, sharing the choices used by the inline account editor. The product choices also include the current product catalog, including products not yet assigned to an account. New accounts start with explicit blank prompts; existing and legacy assignments remain selected when editing. Choices are rebuilt when the modal opens, deduplicated without case sensitivity, and saved through the existing account persistence path. Native dropdown arrows are visible in the modal.

Verified 20 September 2026:
- 127/127 regression scripts passed. New behavioral coverage checks create/edit controls, blank defaults, shared catalogs, duplicate choices, legacy-value retention, catalog refresh on reopen, and selected employee/product in the saved payload.
- All 14 required browser suites passed, covering audit persistence, review rounds, independent devices, auth/conflict recovery, inline content, safe release updates, append imports, deduction adjustments/evidence/details, calendar, general navigation and Facebook Pages.
- The additional list-facebook-dropdown477 browser suite passed using the actual page with mocked authentication and an isolated backend: UI selection, successful save, a separate browser reading the saved employee/product, old assignments, reset on reopening, responsive layouts at 1280/760/390 pixels, and dark mode. Desktop and mobile screenshots were inspected. The suite is included in CI for future releases.
- HTML and release.json both identify fix477. Initial HTML is 637,964 bytes, below the 640,000-byte limit. All three changed runtime assets have versioned URLs.
- Tests create only local mock records. No real Facebook accounts, credentials, or employee assignments are changed by verification.

Deployment completion requires successful Pages and CI runs, public asset comparison, and read-only inspection of the signed-in production create form. The checks do not establish that every employee device or future network condition was tested.
