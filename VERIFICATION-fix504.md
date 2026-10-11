# fix504 — Audit delivery link actions

Labeled submitted links such as `KP : https://...` previously failed the starts-with-HTTP check, hiding their copy/open controls. Extract a single HTTP(S) URL for those actions while retaining the original display and stored data. Always render both action slots; empty or ambiguous/non-HTTP destinations have a disabled open control. No order data, permissions, or save schema changes.

Validation: 140/140 regression scripts passed, including labeled/plain URL copy and open targets, empty values, unsafe schemes and ambiguous multiple URLs. The isolated browser workflow verifies a labeled image link produces an enabled target and empty VER 2 displays two disabled controls. Full browser suite and mobile verification results are recorded before release.

Production UI inspection is currently limited by the in-app browser timing out while attaching to the signed-in tab. No production orders were saved or deleted. Public build and changed asset verification follows Pages deployment.

Final local results: 24/24 browser workflow suites passed; independent cross-device suite with RB_TEST_MOBILE=1 passed. HTML is 639952 bytes. Both changed runtime and CSS assets use fix504 cache versions.
