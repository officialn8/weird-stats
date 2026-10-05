# Modular content verification

October 4, 2026. This pass changes the authoring/build system and adds one unpublished political-data draft. It does not publish that draft or reconnect GitHub to Vercel.

## Original modular pass

### Checks

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

## Review corrections — October 4, 2026

The shared bar/line renderer now keeps its answer, chart, measure controls, numerical table, and CSV link inside a closed native disclosure. The Senate candidate now compares California with the 21 least-populous states, with a complete calculation audit in the daily packet. It remains `review` with no approval or publication date.

The chip revision matches its sound-treatment demo, adds optional A/B/no-difference impressions without scoring, and makes perceived freshness the main reveal. The informal 15-of-20 response is supporting context. On mobile a second reveal button follows the listening controls so readers do not need to scroll back to the question. Reset clears the impression and both reveal buttons' expanded state.

Verification:

- Ten tests pass using fictional fixtures. Every test build writes into an automatically cleaned temporary directory. Both retired and removed draft cases build successfully. No test imports live editorial records.
- Built both editions, then hashed every file and recorded modification times before and after `npm test`: neither `dist/` nor `review-dist/` changed.
- `npm run check`, published build (four entries), and review build (five entries) pass. New bar/line tests verify that charts, controls, tables, and downloads stay within the closed disclosure.
- Browser: closed chart and table report not visible and are absent from the accessibility tree. Enter opens the reveal. The two measure views show the verified population totals and 2 versus 42 seats; the table includes all four values. Closing the reveal hides these again.
- Chip: keyboard impression selection does not reveal or play audio; A and B play their respective clips; mute works; direct silent reveal works without an impression; mobile post-listening reveal works; reset clears all choices. Desktop and mobile reveal layouts inspected, including dark appearance.
- At 390 × 844, document and scroll widths are both 390. Desktop checked at 1280 × 800. No captured browser errors or warnings. Temporary viewport and appearance overrides were reset.
- Final local Lighthouse audit: performance 93, accessibility 100, best practices 100. SEO 63 is expected for the intentionally noindex editorial edition.
- New reports and preview screenshots go under ignored `reports/`. Existing tracked artifacts and Git history were not rewritten.

The reader protocols now specify version 2 copy and separate fresh visual/text cohorts; repeat exposure is usability evidence only. Historical creator responses remain unchanged. No independent version 2 reader responses exist yet.

These are local review changes. No production deployment, publishing approval, push, or integration change was performed in this correction pass.

### Follow-up review before committing

The Senate reveal headline now includes both seat allocations, and its first chart view is Senate seats. The population view remains available beside its control. Chip copy now asks “Could your ears make a chip seem fresher?” and the reveal acknowledges A, B, or no difference; skipping supplies no invented choice. Reset clears the choice and feedback. All four paths were exercised in the browser; the mobile document stays within 390 pixels. Both builds and all ten tests pass.

The active version 2 text script now changes the selfie opening and adds the five-foot model result, the historical AAFPRS surgeon-response poll, EFF’s blue-light method, and the ice-cream weight requirement. Primary references are linked in the script and research notes. These revisions remain untested with fresh readers.

This follow-up saves the complete review corrections on `fix/editorial-reveal-review`. No deployment or push was performed; no new claim about live Vercel state is inferred from Git status.
