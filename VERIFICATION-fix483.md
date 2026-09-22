# fix483 — Employee personal test work

Adds งานเทสส่วนตัว beside the existing order actions. Employees create their own work with repeatable Facebook/page/campaign/ad-link rows and a single ลิงก์รวมงาน. Only the work-type editor changes; existing Audit and submission workflows receive the matching campaign/VER identity and shared evidence URL.

Uses native durable order saves, review rounds, correction evidence, approval and deduction detection. Deadlines remain required by the existing order validation. One personal order remains one order for existing quota rules; VER rows do not introduce a separate financial rule. Source rows lock after submission, while the existing correction workflow remains available to the owner. Switching from ordinary work clears its editor to prevent stale fields leaking into personal work.

Validation: 130 regression scripts; all 18 browser workflow suites; extended personal-work flow (two VERs, separate identities, draft, offline submission/retry, independent Audit session, correction evidence, approval, ownership boundaries and mobile width); additional mobile cross-device suite. Final editor cleanup was checked by rerunning regression and the personal browser flow. All tests use isolated data; no production employee records used for testing. HTML remains below 640,000 bytes. Release and HTML build are fix483.

Deployment verification: compare public assets with tested files, check GitHub Pages and regression workflow results, and inspect signed-in production UI. Physical iOS/Android devices and every real employee account are not directly tested. Database rules and deduction rates are unchanged.
