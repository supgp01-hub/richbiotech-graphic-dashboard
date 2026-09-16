# fix471 — exact Audit source tab and acknowledged sync time

Completes fix470 by using the actual `บันทึกออดิต` tab ID (1752176564) with a native `gid`/`range` link, and recording the last import time only after the online sync metadata write succeeds. A sheet-name-only fragment was found to open the default Dashboard tab in Google Sheets, so it was replaced with the observed source tab ID. Source proof updates remain separate from financial fields.

Validation on 16 September 2026:

- 122/122 regression scripts; all 11 established isolated browser suites; the new Audit evidence suite, including central sync timestamps, full local storage, separate roles, conditional concurrent writes and retry after lost acknowledgements.
- On signed-in production fix470, every one of the 12 evidence buttons was inspected and matched the actual source workbook URL and employee tab. All 12 original IDs remained present; the selected source category showed 12 overdue deductions and ฿600 pending, matching the pre-release view.
- The source worksheet tab ID was observed by opening `บันทึกออดิต` in Google Sheets. Navigation using the corrected native range URL completed; the final selected-range UI inspection was blocked by automatic approval review reporting exhausted workspace credits.
- Initial HTML remains 637,716 bytes. No database rule changes. No production work-status, deduction amount or decision changes were made for testing.

Final deployment verification uses GitHub checks and public asset hashes. A further signed-in UI inspection of fix471 remains unverified while browser tool use is blocked. The prior production evidence-target inspection and the isolated browser tests should not be described as testing every employee's physical device.
