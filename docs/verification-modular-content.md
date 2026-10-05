# Modular content verification

October 4, 2026. This pass changes the authoring/build system and adds one unpublished political-data draft. It does not publish that draft or reconnect GitHub to Vercel.

## Checks

- Nine Node tests passed: status/date publication gating; approval requirement; evidence and chart-domain validation; irregular line-chart x spacing; HTML escaping; CSV safety/content; stale-review reporting; exclusion of draft HTML/feed/CSV from the published build; reordered next links.
- `npm run check`, `npm run build`, and `npm run build:review` passed. The published edition has four entries; the editorial edition has five.
- Local browser: People/Senate-seats toggles, Enter-key activation, reveal disclosure, complete source-data table, and updated accessible chart descriptions verified.
- Mobile at 390 × 844: document width and scroll width both 390. Dark appearance and motion-off exercised. Desktop compositions inspected at 1280 widths.
- Regression checks: chip reveal and next link route into the inserted draft, copper's penny acknowledgment, and mail's reduced-motion result. No captured browser errors or warnings.
- Lighthouse on the local **editorial** edition: performance 93, accessibility 100, best practices 100. SEO 63 reflects the intentional noindex review environment. This is not a published-page SEO report.
- The line renderer's coordinate math is unit-tested; its browser appearance has not been independently reviewed with a real line-chart entry. No broad cross-browser claim is made.

## Editorial and operational limits

The Census table and Senate institutional source were opened for the draft, and its ratio was recalculated. Novelty and reader appeal have not been validated. The historical period is explicit.

The daily Codex heartbeat is active for 9 a.m. in the user's local Central timezone. It prepares review material in this chat, not unattended public releases. It has not yet completed a scheduled run. Published source refreshes still require editorial review.

The hosted production site remains the earlier four-entry deployment. The modular system and new draft are available in the local editorial preview; a release is separate from drafting. Automatic Vercel Git access remains unapproved.
