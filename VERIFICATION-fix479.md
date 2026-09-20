# fix479 — Show the selected notification like its menu option

The closed Facebook Pages notification field now displays the selected option's circular icon, bold label and matching red/amber/green background, as requested. Its visual face stays paired with the original native select so pointer input, keyboard navigation, accessible labels, pending-save disabling and existing online persistence continue to work. The face updates from the same state used by the menu, including retry and cross-browser refresh. Light/dark and mobile styles are included.

Verification on 20 September 2026:
- 128/128 regression scripts passed.
- The Facebook Pages browser suite now verifies the visible selected face (not merely the native select style): matching label, circular SVG icon, color and bold type for all three values; keyboard menu opening; online acknowledgement; independent-browser reads; failure/retry; reset/reload; dark mode; and responsive widths. Local fixture screenshots were inspected.
- All 14 required browser suites plus the fix477 account dropdown suite passed. Audit persistence initially timed out awaiting the asynchronous stale-form warning during the parallel run; its unchanged full suite passed when rerun alone, retaining the stale-status/no-write assertions. Initial and rerun results are retained in the private deployment receipt.
- HTML and release.json agree on fix479, the changed Facebook Pages script/style URLs are versioned, and initial HTML is 638,431 bytes (limit 640,000).
- No production account or notification data is created or changed for tests. Production verification reads the selected controls and opens/closes the menu only.

Completion requires successful Pages deployment and CI, matching public assets, and signed-in production inspection. The tests cover these scenarios, not every physical employee device or future network condition.
