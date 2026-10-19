# fix514 — consistent calendar date states

All day cells use the same 6px corner radius. Selected dates use green backgrounds in single-date and range pickers. Today retains aria-current=date and is marked by a small currentColor dot below the numeral, including a white dot when selected. The orange outline and orange numeral are removed. No date selection or filtering logic changes.

Validation: 144/144 regression scripts passed; 27/27 required browser invocations passed (26 distinct suites; ID-card load ran twice); additional mobile cross-device test passed. Isolated Chromium checks and screenshot inspection verified light/dark day shapes, green selection, no border, and dot contrast on selected today. git diff --check passed. HTML remains below 640000 bytes. Build and release.json: fix514.

No production records were written for tests. Public assets and signed-in UI are verified after deployment; coverage does not imply every employee device/network was tested.
