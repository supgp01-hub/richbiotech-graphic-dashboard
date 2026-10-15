# fix509 — Ads Optimizer leave quotas and Top

Nui and Mind now receive four regular leave days per existing 26th–25th cycle. Added Top to the Ads Optimizer leave roster with the same four-day limit, display color/initial, filter option and case-insensitive self-edit identity mapping. Other staff remain at six days; annual vacation and existing exception/staffing rules are unchanged. Existing leave records are not rewritten or removed. No account or access role is created by this change.

Validation:
- 142/142 regression scripts passed, including quota boundaries, new-cycle reset, multi-day quota enforcement, Top's optimizer staffing rule and self-only editing.
- Calendar browser coverage verifies Top appears once, the filter includes Top, all three optimizer quotas are four, and other staff quotas are six.
- The general smoke fixture previously asserted six days for everyone; updated it to assert the requested 4/6 split and all rendered quota rows. Its rerun passed.
- All 26 distinct required browser suites passed after targeted reruns. The ID-card fixture initially checked a stale idle flag before its scheduled save; it now waits for the matching mock PUT acknowledgement and retains the backend-value assertion. Its rerun passed; production ID-card code was not changed.
- Required browser suite results and production read-only verification are recorded in local release reports. No real employee leave records are created for tests.
- HTML size: 639985 bytes (limit 640000).
