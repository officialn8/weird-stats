# PostHog setup review — October 6, 2026

The installation gathers its six intended events, but the measurement plan has fallen behind the site's newer interactive articles. Fix reporting and add specific editorial events before treating this as a complete view of audience behavior.

Reviewed the local implementation and the live **weird.stats** project, `646286`, in Projects LLC, US region, timezone America/Chicago. This was an audit: no tracking settings, dashboards, production code, release pins, or deployments were changed. No production browser traffic was generated.

## Verified evidence

- Project ingestion token matches `config/analytics.json`; authorized domain is `https://weirdstats.dev`.
- IP anonymization is enabled, GeoIP transformation is disabled, and session recording is off. Client configuration disables persistence, person profiles, autocapture, pageviews, exceptions, performance capture, surveys and external SDK extensions.
- All six intended events exist in captured data: `visit_started`, `discovery_viewed`, `discovery_revealed`, `discovery_continued`, `discovery_share`, and `collection_opened`.
- The fixed event audit window was `2026-10-05T00:00:00Z` through `2026-10-06T08:45:00Z` (October 4, 7 p.m. through October 6, 3:45 a.m. CDT). Data was queried shortly before the upper bound; this is a snapshot, not a claim that future arrivals were inspected.
- 308 captured events represented 143 page visits: 133 unmarked and 10 marked QA. Every observed visit had exactly one start and one distinct SDK identity. This checks received events; it cannot reveal wholly missing visits or events blocked before ingestion.
- All 308 events were classified as automation/bots. The property allowlist removes raw user agent data; the repository already documents the resulting `no_user_agent` classification. This classification does not establish that these visitors were bots.
- Eight early QA events retained city enrichment, all between October 5, 1:14:21 and 1:15:06 a.m. CDT, before GeoIP was disabled. The city-property inspection found no later enriched events in this window.
- The existing rolling-seven-day engagement insight returned 56 eligible collection visits, one visit with two distinct reveals, and 1.8%. This is an operational result contaminated by documented unmarked testing, **not an audience conversion estimate or launch verdict**. The launch evaluation window is not established in the measurement record.
- `node --test tests/analytics.test.mjs`: all nine tests passed. These cover deduplication, privacy gates, share outcomes, build inclusion and QA propagation. No new end-to-end browser or SDK delivery test was performed in this audit.

## Findings, in priority order

### 1. The primary dashboard does not match the installation

The project's primary dashboard is [Your starter dashboard](https://us.posthog.com/project/646286/dashboard/2171010), containing eight generated insights. The inspected pageview tile queries `$pageview`; its visit-to-interaction funnel queries `$pageview` → `$autocapture`. Both events are explicitly disabled. Retention and active-person labels also conflict with memory-only, per-page identity. The working [collection engagement insight](https://us.posthog.com/project/646286/insights/2IZHwHcR) is saved separately and is not attached to any dashboard.

Recommended: make a purpose-built editorial dashboard with page visits, entry exposure, distinct reveals among exposed visits, continuation, share intent/completion/cancellation, and individual-page onward clicks. Label denominators as page visits. Keep QA separate and explicitly annotate/exclude the documented unmarked test interval for operational analysis. Preserve the existing fixed launch decision rule rather than silently redefining it.

### 2. New custom interactions are invisible

`public/assets/transport.js` and `public/assets/death-row.js` implement interactive controls without analytics callbacks. The collection's “Read the Deep Dive” link also has no explicit click event. The property/event allowlists would reject new event types unless extended deliberately.

The live snapshot contains 13 unmarked transport heading views and two death-row heading views, but the current implementation cannot report their control use, evidence openings, or reading completion. A heading seen for one second is exposure, not comprehension or article completion. Both entries are intentionally outside the revealable set; manufacturing reveal events would distort the contract.

Recommended additions:

| Event | Meaning and bounded properties | Decision supported |
| --- | --- | --- |
| `discovery_interacted` | Explicit control use; `entry_id`, fixed `control_id`, fixed `value` | Which interactive explanations readers use |
| `deep_dive_opened` | Collection-to-article click; `entry_id`, placement | Whether previews earn further reading |
| `reading_milestone` | Visible section reached with a dwell threshold; `entry_id`, fixed `section_id` | Where deep-dive readers stop |
| `evidence_opened` | Disclosure opened; `entry_id`, evidence kind | Interest in methods and uncertainty |
| `source_clicked` | Citation or CSV click; `entry_id`, stable source ID/type | Which supporting material readers inspect |

Deduplicate milestones and throttle continuous controls; never emit one event per animation frame or slider input tick. Count download clicks as intent, not proof of a completed download. Leave reveal semantics unchanged. Continuation should gain a separate format-neutral measure: the current `lastRevealed` rule cannot start from an immediately visible finding.

### 3. Acquisition and presentation context are absent

The allowlist strips referrer, UTM, browser, device and URL metadata. Events also lack collection position, release/content revision, format and individual-page entry ID on `visit_started`. An individual-page visitor who leaves before a heading view cannot be attributed to a particular entry. Newest-first placement changes over time, so aggregate entry rates confound content with placement.

Recommended: attach `page_entry_id` for individual pages, `entry_position`, `treatment_kind`, and a build/release identifier. For acquisition, use bounded campaign codes and coarse source categories, computed locally and kept in memory. A viewport bucket can identify narrow-screen problems without exact dimensions or a raw user-agent string. Sanitize and bound any external string; never send arbitrary query strings or full referrers. These are proposed extensions to the current privacy scope, not existing collection.

### 4. Bot and QA interpretation require custom reports

PostHog's bot filter would remove every observed event. Its [traffic classification](https://posthog.com/docs/web-analytics/bot-detection#virtual-properties) uses user-agent/IP information that this implementation intentionally withholds. The browser webdriver gate and `qa` marker exclude some testing, but ordinary-browser automation can pass the gate. The launch record already documents 72 unmarked test visits on October 5, 12:39:50–12:51:03 p.m. CDT; `qa = false` alone cannot clean those historical events.

Recommended: retain explicit QA marking, document known test windows in operational reports, and never equate the existing bot classification with recognized automation. Decide whether stronger bot detection warrants additional metadata before changing that privacy choice. Do not retroactively label all unknown visits as human.

### 5. Performance and technical failures are not measured

Client-side performance and exception capture are disabled, and their event types would also be dropped by `filterEvent`. Project settings show performance/console options enabled, but that does not override the client allowlist into collecting those events. The richer WebGL experience has a local fallback but no telemetry indicating fallback usage or context loss.

Recommended: add bounded visualization-ready/fallback/error events and sanitized web-vital measurements (LCP, INP, CLS) with viewport and release context. Avoid raw exception text or URLs unless scrubbed. Turning on a PostHog UI setting alone is insufficient: implement, allowlist, test and verify the complete event path. See [JavaScript configuration](https://posthog.com/docs/libraries/js/config).

### 6. Returning readership cannot be answered by this identity model

Memory-only identity resets on full navigation and reload. Consequently, direct article → collection journeys cannot be joined, repeat visitors cannot be recognized, and week-to-week reader retention cannot be measured reliably. This is a deliberate scope limit, not an SDK malfunction. See [PostHog's memory-persistence attribution guidance](https://posthog.com/docs/web-analytics/campaign-attribution-troubleshooting#how-do-i-fix-attribution-issues).

Keep this limitation explicit on dashboards. Most recommendations above work within the current memory-only model. Persistent identity or replay would be a separate product/privacy decision; neither is necessary to repair the immediate editorial measurement gaps.

## Implementation sequence

1. Correct dashboard selection and labels; preserve and annotate the existing launch metric.
2. Extend the event contract with entry/release/position context, deep-dive clicks, meaningful interaction, evidence access and reading milestones.
3. Add coarse acquisition and viewport context plus sanitized technical-health events.
4. Verify locally using a capture stub/receiver, including fast navigation and native-share completion while page visibility changes. The current callback ignores share outcomes while `document.hidden`, a potential undercount worth testing on mobile.
5. After an authorized release, perform a bounded `?qa=1` production event check under `docs/launch-analytics.md`, then verify received properties, counts and QA exclusions in PostHog.

Source references: `public/analytics.js`, `scripts/analytics.mjs`, `public/share.js`, `public/discoveries.js`, both custom interactive modules, `tests/analytics.test.mjs`, and `docs/launch-analytics.md`; live project settings, transformation inventory, event schema/records, saved insight definitions and engagement insight execution.
