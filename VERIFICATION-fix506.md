# fix506 — Six monthly days off for every employee

All nine employees in the existing leave roster now have max:6 for ordinary cycle days off, including Supervisor, Specialist, Graphic & Ads, and Ads Optimizer. Validation, remaining totals and summary progress use the same roster maximum. The monthly cycle remains the established 26th through 25th. Existing records, annual vacation allowance, consecutive-day/staffing rules, and documented exception behavior are preserved.

Validation: 141/141 regression scripts passed. Expanded cycle tests cover all employees' sixth/seventh days, next-cycle reset, projected batch limit, moving an existing day without double counting, annual leave and staffing limits. Browser smoke verifies every employee's summary shows /6. Full browser suite and additional mobile cross-device results recorded before deployment. No real leave records were changed.

Final results: 25 browser suites passed (24 passed initial run; thai-holidays465 retained its over-quota/atomic rejection assertions, updated its old 4-day fixture to 6 days and passed on targeted rerun). Additional mobile cross-device suite passed. All summary rows confirmed /6. HTML remains below 640000 bytes.
