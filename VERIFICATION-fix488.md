# fix488 — shared Facebook account names

List Facebook displays “แชร์บัญชีไหน: …” directly below the account name, using the requested sheet's G (account name), C (employee), and V (shared account) columns. Existing account records, credentials, status, ownership and follow-up history are not rewritten. The new read requests only these three columns. Nothing from the private source export is included in this repository.

Matching uses trimmed case-insensitive account name plus employee (MOS/MOSS compatible). Duplicate source keys and manual accounts are excluded. Empty source values remove the display line. Text is HTML-escaped. Search includes the shared account name. The narrow source is read on workspace initialization, cached for offline display, and refreshed by the existing refresh action. Failed reads retain the last available values and do not claim an online save.

Source check: the current source response contains 48 rows, including 20 nonempty shared-account values and zero duplicate name/employee pairs. This does not establish completeness beyond the source response (the Google Sheet currently has a filtered view). No full sheet or credentials were downloaded for this change.

Validation: 132/132 regression scripts passed. Dedicated behavioral coverage checks matching, duplicate exclusion, employee boundaries, manual isolation, quoted commas, offline retention, refresh, blank clearing and HTML escaping. The existing List Facebook browser test additionally checks the real rendered subtitle, search and mobile fit. Broader browser and deployment results are recorded in the private deployment receipt after completion. Physical phones and every employee account were not tested.
