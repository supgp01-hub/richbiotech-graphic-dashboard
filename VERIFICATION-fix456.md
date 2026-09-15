# fix456 — bounded account restoration

Production inspection after fix455 found the existing session waiting indefinitely at account restoration. Token refresh and profile response/body reads lacked a deadline.

- Bound restoration network requests to 12 seconds and abort stalled requests. The existing transient-error flow retries automatically without deleting session credentials or drafts.
- Share concurrent token refresh requests within the same session to prevent parallel refresh storms.
- Keep expired/revoked credential handling unchanged. Real expiry still requires login; no authentication or database rules were weakened.
- Carry forward fix455's cross-device reconciliation and release checks. Build and release manifest both advance to fix456.

Validation: 111/111 offline regression scripts pass. Stateful browser suites cover authentication timeout/retry, Audit persistence, review rounds, full navigation smoke, and independent employee/Audit cross-device sync. CI includes all five suites. No fabricated production jobs or review decisions.

Production checks must distinguish deployed code from the unresolved employee-local conflict queue: the screenshot's 106 operations have not been individually verified. The administrator CLI credential has expired; a Google sign-in request is pending. Existing account restoration is being checked in the production UI after deployment. Earlier clients need one initial load of fix455 or later before automatic release detection exists on that device.
