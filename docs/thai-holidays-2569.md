# Thai government holiday annotations, 2569 (2026)

Reviewed 15 September 2026. These are verified overrides for 2026, taking precedence over the recurring calendar engine added in fix466. The display does not create employee leave, close the company, change capacity, or alter deadlines/deductions. All devices receive the same dates in the release. Visibility is a device preference.

Sources:

- Annual overview: https://www.thaipbs.or.th/now/content/3472 (fixed holidays and lunar dates, checked against the government updates below).
- April: https://pathumthani.moc.go.th/th/content/category/detail/id/161/iid/156846 — Chakri 6 April; Songkran 13–15 April.
- Royal Ploughing: https://www.songkhlacity.go.th/2020/news/detail/19155 and https://capr.tsu.ac.th/upload/files/1777604073_b167d9d87f9f076c.pdf — **13 May**, replacing the earlier 11 May date.
- Visakha/substitute: https://www.angthong-kp.go.th/news-detail?hd=1&id=138067 — 31 May and 1 June.
- July: https://pathumthani.moc.go.th/th/content/category/detail/id/161/iid/172817 — 28, 29 and 30 July.
- No extra 2 June / 31 July: https://www.thaigov.go.th/th/news/164041 — exclude unapproved proposals.
- 12 August retained: https://www.thaigov.go.th/th/news/166703.
- 16 October: https://www.thaigov.go.th/th/news/164228 — special holiday for government offices **in Bangkok only**, explicitly labeled; the WFH dates are not holidays.

May 1 Labour Day is not included as a government holiday. Religious observance days (วันพระ) are not implicitly government holidays. Actual and substitute dates are separate entries. Update the versioned dataset from authoritative announcements when adding a year or a new special holiday, and retain regression tests for withdrawn/changed dates.

## Recurring years (fix466)

`thai-holiday-calendar-v1.js` computes each selected Gregorian year locally (B.E. input is converted by subtracting 543). It includes fixed annual dates, Thai Suriyayatra lunar full moons, Khao Phansa the following day, and government substitution rules. It checks adjacent years to retain substitutes crossing December/January. Consecutive holiday blocks receive at most one substitute on the next available weekday. Multiple holiday names on one date remain visible together.

- Substitution principle: Cabinet Secretariat https://www.soc.go.th/?page_id=1045 (1 May 2001 and 3 February 2004 resolutions; at most one replacement day for the continuous block).
- Lunar arithmetic: https://github.com/ultramcu/thai_lunar.dart and https://github.com/hmmbug/pythaidate, MIT; see `thai-calendar-LICENSE.txt`.
- Independent 2024 date fixtures: Royal Gazette https://ratchakitcha.soc.go.th/documents/140D212S0000000001100.pdf (only date cross-checks; bank-specific policy is not imported).
- Independent 2025 fixtures: https://saving.wu.ac.th/wp-content/uploads/2025/01/ประกาศวันหยุดประจำปี2568.pdf.

Calculated years are visibly labeled as calculated, not a published official annual holiday list. Cabinet special days and Royal Ploughing dates are never copied to another year or guessed; they require verified year-specific updates. The engine runs for the supported date selector (CE 1600–9998); structural date, lunar-count and substitute tests cover 1900–2200. Upstream describes its validated lunar range as roughly 1900–2050; distant dates are mathematical projections and historical government holiday policy is not a complete archive. Policy changes and yearly special days still require authoritative announcements. This does not promise that an unannounced future holiday is already known.
