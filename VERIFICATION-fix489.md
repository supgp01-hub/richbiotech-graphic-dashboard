# fix489 — complete shared-account reads and desktop height

The gviz query used by fix488 returned only 48 rows from the filtered worksheet, so many legitimate shared-account subtitles were missing. This release reads only the G, C and V columns through separate Google CSV column exports. The verified exports include filtered-out rows. CSV parsing preserves empty rows and quoted multiline values, and pads trailing empty cells when one column ends earlier. Credentials are never requested by this new sharing read.

Matching prefers account name plus employee. If the employee changed, a unique source name may match exactly one current account; ambiguous names remain excluded. Existing accounts and their history are not rewritten. A failed column read preserves the last complete sharing cache. Manual accounts remain excluded. The sharing cache version changes to discard the incomplete fix488 view.

The current source produced 923 distinct name/employee keys, 424 populated unambiguous sharing values and 30 ambiguous duplicate keys. Empty cells such as Fly many remain empty; chicken chicken has Ilbert Fayneman. Counts describe the source, not a claim that all keys match current website records.

Desktop workspace height follows the available viewport. Its table and details pane use the remaining height and scroll independently; pagination remains visible. Narrow layouts retain their existing flow. The table no longer requires its old fixed minimum width on desktop.

Targeted validation: real Google column exports succeeded in an isolated browser with a mocked database and rendered chicken chicken → Ilbert Fayneman. Behavioral regression checks include blank rows, multiline names, trailing blanks, duplicate/employee matching, offline retention, refresh and escaping. Browser coverage checks table/footer placement at 850px and 1100px desktop heights and the shared subtitle at 390px. Broader release checks and live deployment results are recorded in the private receipt. Physical phones and every employee session are unverified.
