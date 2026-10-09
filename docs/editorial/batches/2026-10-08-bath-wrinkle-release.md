# Bath wrinkles release — October 8, 2026

Nate approved private packet `6f40037c9f9c2ea7ce967f3d602df7ff4527ba28e425bad49fe15a69103dfa70`, then requested one code review. That review identified two fixes: persistent tests for interrupted interaction transitions, and answer-reveal analytics wiring. Nate then instructed: “Implement the fixes. Commit & merge.” This explicitly authorizes the release through main's production deployment.

The answer disclosure now uses the existing analytics reveal API, and the treatment is registered as revealable. The drawing game and study receipts do not emit answer reveals. Six regression tests execute the shipping runtime to cover reset during draining, visibility interruptions, site/system motion reduction, pointer cancellation, comparison/reset, analytics deduplication and continuation, and unavailable drawing contexts.

The approved copy and illustration remain unchanged. The new runtime bytes are captured by packet `6c5708ff118fb9fd0fa20b83d9955e08ad3b1adbbcb19aa3a4d27e13acd1545c` and approved revision `d99b18a6cd66776d65fd919b40808120c9b88d2f8e78bb4f8ffdc6abd481cccb`. Earlier approvals and proposals remain as editorial history. The release manifest retains all eight existing public revisions and adds bath wrinkles.

Validation: `npm run check`, all 137 tests, and `npm run build` passed. The public build contains nine discoveries, with bath wrinkles first and marked revealable. Local browser checks passed at 1440 px and 390 px: drain, pointer drawing, comparison, answer disclosure, interrupted drain/reset, and skip. Mobile document width equals the viewport width; no browser console errors were recorded. Production analytics ingestion was not part of this local check.
