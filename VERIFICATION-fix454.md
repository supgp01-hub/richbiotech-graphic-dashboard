# fix454 — finish review-round delivery and stabilize Audit controls

Includes the review-round feature described in [VERIFICATION-fix453.md](VERIFICATION-fix453.md).

## Corrections found during verification

- The site-wide margin reset placed the native history dialog at the top-left. Explicit automatic margins center it. Browser assertions now check centering and viewport containment at 1440×1000 and 390×844.
- Repeated delayed Audit source refreshes replaced unchanged controls and interrupted selection/focus. Equivalent data now preserves both sections; changed sources, role, assignment permissions or workflow status still rebuild them. Typed Audit details survive source refreshes.
- A desktop browser focus scroll could close the custom status menu immediately after it opened. The menu now follows its visible control during scroll, and closes when the control moves out of view. Mobile behavior remains unchanged.
- The browser regression uses the visible custom dropdown instead of forcing native option selection. A diagnostic run reproduced the scroll close path; three consecutive complete workflow runs then passed after the fix.

## Verification

- Complete offline regression suite: **108/108 scripts passed**. New regression covers control identity, focus, typed notes, source updates, role/assignee/status changes and desktop scroll behavior.
- Stateful review-round browser flow: initial submission, two correction cycles, both employee submission paths, two HOOKs counted once, duplicate prevention, history, approval and reload passed.
- Stateful Audit persistence browser regression passed.
- Full functional smoke passed five sidebar destinations, eight Graphic tabs, health panel, commission views and new-order button.
- Initial HTML: **635,789 bytes**. Public build/assets and signed-in production UI are verified after publishing.

Production actions during verification are read-only. No employee work was submitted or its status changed for testing. Incomplete older histories remain visibly unconfirmed; this release does not invent missing history or claim every device/network condition was tested.
