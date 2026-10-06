# Editorial analytics verification — October 6, 2026

User authorization: “implement the fixes, verify them and ship the update.” This covers the analytics code, custom PostHog dashboard and production release. Approved discovery content and release pins are unchanged.

## Local verification

- `npm run check`: passed; nine working records, 34 owned assets and anchors validated.
- `npm test`: all 129 tests passed, including six new tests for finite attribution, format-neutral continuation, article/position/revision context, event deduplication, sanitized technical health and individual-page build metadata.
- `npm run build` and `npm run build:review`: passed; eight released entries; private tracking initialization remains omitted.
- Real Chromium browser through Playwright CLI, desktop 1280×720 and mobile 390×844. Local server at port 63126. Normal local origin was confirmed not to initialize tracking.
- Local receiver harness changed only served test HTML's tracking origin, removed the headless/webdriver gates in the test browser, wrapped the real pinned SDK's `before_send`, and intercepted PostHog requests. Final cloud inspection found QA-marked web-vital events predating the production deployment, consistent with unload beacons escaping the local request interceptor. Do not assume browser routing blocks every lifecycle beacon. All captured version-2 events were QA-marked and excluded from reader reports.
- Verified entry exposure, occupancy choices and deduplication, deep-dive click before navigation, QA propagation, all five transport article reading milestones, mass/speed controls, neighborhood camera control, evidence expansion, CSV click intent, and live web-vital events.
- Native share was mocked to resolve while `document.hidden` was true: completion was captured. This tests the callback/lifecycle behavior, not a real OS share-sheet delivery.
- Mobile death-row controls, uncertainty disclosure, slider keyboard interaction, renderer readiness and a forced real WebGL context loss passed. Static fallback returned visibly.
- Blocking Three.js produced `fallback_after_10s` after visible dwell. A synthetic error produced only `error_kind: script`; its secret message did not appear in captured data.
- Blocking the PostHog SDK left the copper reveal and source disclosure functional. All tested mobile content stayed within viewport width.
- Captured events contained no query-string secret, full URL, referrer, raw user agent, IP, session ID, exception body or performance-entry object. Browser cookies, localStorage and sessionStorage were empty throughout the receiver checks.
- Screenshots and local harness output are retained in the working checkout's ignored/uncommitted `output/analytics/` directory.

## Reporting contract

The new operational dashboard is [Editorial readership and site health](https://us.posthog.com/project/646286/dashboard/2176140). Its measurement starts with instrumentation version 2 and excludes QA. The original [launch insight](https://us.posthog.com/project/646286/insights/2IZHwHcR) retains its formula and the version-1 launch contract. Historical unmarked testing is not silently recast as audience evidence. Bot classification remains unsuitable because raw user-agent/IP metadata is withheld.

## Production and dashboard verification

- PR #13 merged at `2026-10-06T08:57:31Z`, commit `8a1aa6bed947fde68e74d0acb2902ed2f27c0b96`. Vercel deployment `dpl_GK79cs7mp5QDxp5yLH6mK2f9xNn8` was READY and aliased to weirdstats.dev with that exact Git SHA. Instrumentation build: `bf73b2cb9c5c4523`.
- Initial marked check at approximately 08:58:49–08:58:51 UTC stopped immediately after deep-dive navigation because the harness checked the QA cue before its script completed. A read-only inspection confirmed the destination retained `?qa=1`, its QA title and strip. No unmarked link was followed.
- Fresh marked walk: `2026-10-06T09:02:54.149Z`–`09:03:04.534Z`. The harness waited for QA cues before interactions. Collection → deep dive → collection preserved the marker. Cookies, localStorage and sessionStorage were empty.
- Cloud ingestion confirmed all nine added event types, plus legacy view, reveal, continuation and onward events. LCP, INP and CLS arrived with numeric measurements. Synthetic error text was absent; only its fixed category was stored. Browser share completion was verified locally with a mocked promise, not a real OS delivery.
- At final audit, 52 version-2 events were present: zero unmarked events and zero events containing raw URL, referrer, user agent, IP, city or session-ID fields. QA data is verification evidence, not audience or performance-baseline evidence.
- Dashboard `2176140` is pinned and is the project primary dashboard. Twelve saved insights executed successfully. Temporary QA-only versions returned the expected matched exposure/reveal counts, coarse sources, controls, section milestones, evidence interest, renderer status, errors and vital values. Saved reader versions exclude QA and returned no audience data at setup.
- Native reports default to seven days; the three SQL tables deliberately use a fixed rolling seven-day window and do not follow the dashboard date picker. The dashboard description states that distinction. Layout and filters were read back after saving.
- The irrelevant starter template was unpinned and renamed “Legacy starter dashboard — unused.” The original launch insight and its formula remain intact.

Every future production browser check must start with `?qa=1`, show the QA strip/title, and preserve that marker. A captured event, rather than merely a successful build or browser request, proves ingestion.
