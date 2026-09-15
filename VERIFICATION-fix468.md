# fix468 — keep holiday controls in the compact calendar toolbar

Production verification of fix467 exposed an initialization-order difference: holiday controls could be created before the workforce toolbar and remain below it. Both creation orders now converge on the same toolbar during initialization/render. No save paths or calendar records change.

Validation: 121 regression scripts and all 11 isolated browser suites; extended calendar coverage simulates pre-existing controls and checks that render places them in the toolbar. Desktop/mobile layout, filters, warnings and multi-year selection remain covered. HTML 637,648 bytes.

Delivery checks: successful CI/Pages, public asset hashes and signed-in production UI. Physical employee devices are not individually tested. No production records are used as writable test fixtures.
