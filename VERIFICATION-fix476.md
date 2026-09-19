# fix476 — Facebook Pages with real names and an orderly table

The Facebook Pages table previously put numbered placeholder rows such as “เพจ 162” ahead of actual page names. This release hides names matching only “เพจ” and a number from the rendered table, filters, pagination and totals. Source rows, cached data and remote records remain intact. Saved name corrections are applied before filtering so a renamed placeholder can appear again with its original identity. Names containing a number and additional words remain visible.

The approved layout gives full page names 40% of the desktop table, aligns the remaining headers and cells, uses subtle alternating rows, and keeps notification selectors and action buttons compact. Missing account metadata is omitted. Names and existing account details wrap; mobile rows stack and the entire page scrolls normally. Dark-mode text uses the existing theme tokens.

Verified 19 September 2026:
- 126/126 regression scripts passed, including named-row filtering, consistent counts/search, unchanged source data, saved-name restoration and empty results.
- 14/14 required browser suites passed: audit persistence, review rounds, cross-device sync, auth recovery, conflict recovery, inline content, auto updates, content append, audit adjustments, sheet evidence, inline deductions, Thai holidays, full navigation smoke and Facebook Pages.
- Facebook Pages browser coverage includes 209 source rows / 206 actual names, full metadata, all-page display, pagination/search, two independent browser contexts, online notification acknowledgements, failure/retry, reset/reload, and viewport widths 1280, 900, 760, 390 and 320 pixels. Tests use isolated fixtures and mocked authentication; no production business records are modified.
- Initial HTML is 637,961 bytes, below the 640,000-byte limit; HTML and release.json agree on fix476. Both changed Facebook Pages assets have versioned URLs.

Deployment completion requires successful Pages and CI runs, public asset comparison and signed-in production inspection. These checks do not claim every physical employee device or future network condition was tested.
