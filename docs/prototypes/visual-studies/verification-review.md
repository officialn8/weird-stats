# Design-review verification

October 4, 2026. Tested the revised native prototype at localhost:63013. This is implementation evidence, not an audience or visual-impact study.

## Browser checks

- Desktop 1280 × 720 and mobile 390 × 844: no horizontal page overflow in the inspected question, comparison, and painting states.
- Copper remained hidden after navigating down the page. The automatic reveal observer and trigger are removed.
- Choosing the penny produced the nickel answer and acknowledged the guess. Choosing the nickel with Enter produced the corresponding acknowledgment. “Show me” produced a neutral reveal.
- Reset hid the answer and restored focus to the direct reveal button in the tested direct-reveal flow. The same handler retains the triggering coin for coin-choice resets.
- The DOM contained exactly sixty penny images. The equation captions visibly name copper in both quantities.
- Keyboard Enter expanded the copper source disclosure.
- The painting's three direct controls reached the overview, one-millimeter grid, and highlighted-pixel views. Ordinary scrolling also advanced the scene; the initial image transform changes with progress.
- Motion-off removed sticky positioning and showed all three painting panels with opacity 1. The OS reduced-motion CSS uses the same static default; an OS setting change was not separately exercised.
- Dark appearance was visually checked on the mobile opener and pixel scene. Appearance was restored to System and the temporary viewport override was cleared afterward.
- Browser console inspection returned no warnings or errors during the checks.
- JavaScript syntax, CSS parsing, HTML ID uniqueness, local asset paths, internal anchors, and document links passed checks. Recomputed 1 / 0.005 = 200 and 200 × 200 = 40,000.

Screenshots: [opener](preview-review-copper.jpg), [millimeter scene](preview-review-painting.jpg).

## Local Lighthouse audit

Report: [lighthouse-review.json](lighthouse-review.json). Mobile emulation on a local Python development server:

| Metric | Result |
| --- | --- |
| Performance | 97 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| Largest Contentful Paint | 2.6 s |
| Cumulative Layout Shift | 0 |
| Total Blocking Time | 0 ms |

The 2.6-second lab LCP is slightly above the 2.5-second target. The local server does not provide production compression/cache policies. These scores do not measure real-user interaction latency or prove complete assistive-technology compatibility. Lighthouse does not exercise the reveal and zoom states; the browser checks above cover those separately.

## Remaining limits

The paint closeup is a labeled mathematical diagram, not a true photographic deep zoom into museum tiles. Unsupported timeline browsers and short viewports are handled by the static CSS default; separate cross-browser runs were not performed. No seal study was built or tested. New editorial candidates and independent reader checks remain outside this design revision.
