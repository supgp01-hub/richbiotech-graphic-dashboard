# Verification — fix496

Request: make date inputs and their calendar match the supplied compact Thai calendar reference, including plain sans-serif typography.

Changes: shared picker for existing date inputs. Sunday-first week, Thai month and Buddhist year heading, Gregorian DD/MM/YYYY field text, current-day outline and selected-day circle. Uses Segoe UI/Tahoma/Arial sans-serif at 13px, matching the reference style rather than inheriting the site's display font. Mobile day buttons enlarge for touch. Existing native date inputs, ISO values, input/change events, read-only/disabled state and min/max dates remain intact. Keyboard navigation, Escape, clear and today actions are supported. Programmatic date changes repaint without dispatching save events. No database permissions, workflow or payload changes.

Validation (2026-10-11):
- 137/137 regression scripts passed.
- Dedicated date tests: October 2026 day alignment, Thai/Buddhist heading, DD/MM/YYYY, leap day, ISO change events, min/max, readonly, clear, month/year transition and keyboard navigation.
- Actual order modal browser test passed: select and clear, month navigation, keyboard, programmatic updates and viewport bounds. Desktop/mobile screenshots inspected; existing global header and background styles were isolated from the picker.
- All 23 browser workflows passed. Separate mobile cross-device test passed: offline retry, independent reads, concurrent edits, clears, reload and release deferral.
- HTML and manifest declare fix496; HTML 639868 bytes, below 640000.

All browser workflow writes use isolated mock data. Physical phones, every real account and production writes are not tested. Public deployment/assets and availability of signed-in UI inspection are checked separately.
