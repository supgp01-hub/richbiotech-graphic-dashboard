# fix490 — Editable shared-account field

Adds “แชร์บัญชีไหน” below the account name in both the create/edit modal and the permanent account editor. Prefills the existing worksheet value; explicit account edits (including clearing the value) take precedence and persist in the existing per-account cloud record. Untouched imported values continue to follow the worksheet. Manual accounts support the same subtitle and search. This does not write back to Google Sheets or change access rules.

Validation:
- 133/133 regression scripts passed, including sharing persistence with exhausted storage, offline/retry, independent account writes, partial acknowledgement, explicit clearing, reload and HTML escaping.
- Isolated browser coverage verifies create, sheet prefill, edit, clear, separate-browser read/reload, desktop/mobile and dark mode.
- Required browser workflow suite: 20/20 passed. Mobile cross-device offline/retry and shared reads passed.
- Initial HTML remains 639,873 bytes.

Production verification is read-only; real employee records are not used as save fixtures. Physical phones and simultaneous edits to the same account are not exhaustively tested; existing account persistence semantics remain unchanged.
