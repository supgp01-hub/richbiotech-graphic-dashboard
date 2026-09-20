# fix480 — Uniform Facebook Pages rows and quieter save feedback

All Facebook Pages data rows now use the same card background instead of alternating green/white stripes, including hover and dark mode. The persistent notification success text is removed. Pending-save and failure/retry feedback continue to use the existing online acknowledgement state; notification icons, labels, state colors, permissions and persistence are unchanged.

Verification on 20 September 2026:
- The Facebook Pages browser suite passed with additional checks that data rows share one computed background in light/dark themes and that successful saves leave no persistent success text. Save checks still require the selected state, cleared pending/error flags and recorded backend value; two-browser reads, failure/retry, reset, reload, keyboard/menu operation, state icons/colors and responsive layouts remain covered.
- 128/128 regression scripts and all 14 required browser suites plus the fix477 account dropdown suite passed (15/15 browser suites). Results are retained in the private release receipt. Isolated mock data is used; production business data is not modified for testing.
- HTML and release.json agree on fix480. Both changed runtime assets have versioned URLs. Initial HTML is 638,431 bytes, below the 640,000-byte limit.

Deployment completion requires successful GitHub Pages and CI, matching public assets and signed-in production inspection. The tests cover these scenarios rather than every physical employee device or future network condition.
