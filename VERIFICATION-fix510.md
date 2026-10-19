# fix510 — Unlimited concurrent leave

Removed the per-day departmental headcount rejection from the common leave validator. All employees may now take the same date off, including all Ads Optimizers and all Graphic staff. Single-day, edit and multi-day paths continue through the existing personal quota, consecutive-day and duplicate checks. Existing documented quota exceptions, annual vacation, availability warnings and leave data remain unchanged.

Validation: 142 regression scripts passed, including sequentially adding every employee to one date for each leave type, duplicate rejection, 4/6-day quotas, cycle boundaries and edit accounting. Required browser suites run before production push. No real leave records are created or removed during validation. HTML remains under 640000 bytes.
- Browser validation: all 26 distinct required suites passed (27 successful invocations including the duplicated ID-card check).
