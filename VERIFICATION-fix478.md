# fix478 — Restore Facebook Pages notification colors

The notification dropdown lost its state colors when the former badges were replaced with selects. Its popup also classified the Thai word for a notification round as a generic waiting status. Notification dropdowns now explicitly map their saved values to red (not notified), amber (first round / page share), and green (second round / ads), without changing unrelated dropdown semantics. The selected field uses the same color families, with readable dark-theme variants. Saving, retry, permissions and shared data are unchanged.

Verification on 20 September 2026:
- 128/128 regression scripts passed, including distinct popup colors, selection/change events and isolation from unrelated status menus.
- The Facebook Pages browser suite checks actual popup icon colors, all three selected-field colors, light/dark themes, choice via popup, save acknowledgement, an independent employee browser, failure/retry, reset and reload. Existing all-page, name, filter and responsive checks are retained.
- All 14 required browser suites and the Facebook account dropdown suite added in fix477 passed (15/15 total). Results are recorded in the private deployment receipt.
- Initial HTML is 638,431 bytes, below 640,000; HTML/release.json agree on fix478 and the changed CSS URL is versioned.
- Browser tests use isolated mock accounts and backend data. Production inspection opens the status menu without saving or changing real notification values.

Completion requires successful GitHub Pages and CI, matching public assets, and signed-in production inspection. This verification does not claim every physical employee device or future network condition was tested.
