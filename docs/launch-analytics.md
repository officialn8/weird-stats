# Launch measurement

The [launch decision](editorial/2026-10-05-launch-decision.md) fixes the product threshold before promotion. Deployment itself does not start that evaluation window.

## Privacy and scope

PostHog is configured with `persistence: 'memory'`, `disable_persistence: true`, `person_profiles: 'never'`, and `ip: false`. There are no analytics cookies or persistent local/session-storage identifiers. We deliberately measure a single loaded page rather than identifying a person across visits. This uses the SDK's [memory persistence](https://posthog.com/docs/libraries/js/persistence), not its separate server-hash identity mode.

Autocapture, pageview/pageleave capture, recordings, surveys, performance capture, exceptions, rage/dead clicks, and feature-flag requests are disabled. The pinned SDK is served from our own build; external SDK extensions cannot load. An allowlist drops unrequested events and properties, including URL queries, referrers, browser metadata, and person updates. The dedicated project discards IP addresses and has its GeoIP transformation disabled. Both settings matter: [IP deletion alone does not prevent location enrichment](https://posthog.com/docs/privacy/data-storage). No `identify` calls or email collection.

Tracking runs only at the configured production origin, on the collection and released discovery pages. It does not initialize on localhost, previews, review pages, 404s, or withdrawn pages. Do Not Track, Global Privacy Control, and the browser automation flag (`navigator.webdriver`) disable it. Default Playwright, Puppeteer and Selenium runs set that flag and send nothing; the Claude in-app browser, extension-driven Chrome and Playwright attached to an ordinary Chrome do not set it and are tracked like readers unless the visit is marked (see [QA procedure](#qa-procedure)). A blocked or failed analytics request never blocks a reveal or share.

Configuration: `config/analytics.json`. The project ingestion token is public client configuration, not a personal API credential. `enabled: false` omits analytics initialization and the SDK from generated pages. A configuration change reaches the site with the next production deployment, normally a push to `main`. Never place a personal API key here. See [PostHog configuration](https://posthog.com/docs/libraries/js/config) for the SDK option definitions.

## Event contract, version 1

Every event includes a random memory-only `visit_id`, `page_kind` (`collection` or `discovery`), `available_reveals`, `schema_version`, and `qa`. Production checks start at a `?qa=1` address; the page then carries the marker on its own links to the collection and discovery pages, so the whole walk stays marked. Exclude these events from product results. Page reload/navigation creates a new visit ID. Browser back-forward cache restoration retains that page visit.

| Event | Meaning | Extra properties |
| --- | --- | --- |
| `visit_started` | Page first becomes visible; once per page visit | none |
| `discovery_viewed` | At least half of its heading stays in view for one second in a visible tab; once per entry | `entry_id` |
| `discovery_revealed` | An explicit reveal opens; once per distinct entry, including after replay/reset | `entry_id`, `revealed_count` |
| `discovery_continued` | After a reveal, a later discovery's heading meets the same visibility rule; once per source/destination pair | `entry_id`, `from_entry_id` |
| `discovery_share` | Share-button intent, native cancellation/completion, clipboard completion, or manual fallback | `entry_id`, `method`, `outcome` |
| `collection_opened` | Individual discovery's “Keep wandering” link clicked | none |

Chips, copper, and generic disclosure treatments can emit reveals. Mail and painting are immediately visible/scroll-led discoveries: viewing them is **not** manufactured into a reveal. Selecting a guess, opening receipts, automatic animation, replaying, and copying the manually offered fallback do not fabricate new discovery reveals or successful shares. A native promise resolving or a clipboard write succeeds only as a browser action; it does not prove delivery to a friend.

## Readout

Choose and record actual launch start/end times after promotion is authorized. Use events within that window with `qa = false`, `schema_version = 1`, `page_kind = 'collection'`, and `available_reveals >= 2`.

Denominator: distinct `visit_id` values with `visit_started`. Numerator: those same visit IDs with at least two distinct `entry_id` values on `discovery_revealed`. Divide numerator by denominator. Use visit IDs, **not** PostHog's unique-person or session count. Do not count `revealed_count` sums or raw reveal clicks.

Also report per-entry views/reveals, the fraction of visits with `discovery_continued`, share intent, and completed browser share actions. Keep individual-page traffic separate. At the launch readout, report sample sizes, blocked/missing telemetry limitations, traffic mix if independently known, and the dates; do not invent source attribution from stripped referrer data.

The threshold is 30% of at least 300 eligible collection visits revealing two discoveries. A minimum sample below 300 after 14 days is inconclusive. Full decision branches are in the launch decision document. These are page visits, not 300 verified strangers.

## Activation verified — October 5

Nate explicitly authorized the separate project. [weird.stats](https://us.posthog.com/project/646286/settings/project) is project `646286` in `Projects LLC`, US region, with timezone `America/Chicago`. The existing Portfolio project was unchanged. IP storage is disabled; the default GeoIP transformation was also disabled at `2026-10-05T06:16:55Z`. Recordings and person profiles are off.

Configuration was activated in commit `efa73c6`, pushed to the private working branch, and deployed to production as `dpl_AFeSB5BmZuJEJZeS3VV8bckCrqT1`. All 76 tests and both builds passed. The [hosting record](hosting.md) identifies the immutable deployment.

A production browser visit marked `?qa=1` produced `visit_started`, views, distinct chip and copper reveals, continuation from chips to copper, and share intent in this project. Both reveals used the same visit ID; the second had `revealed_count: 2`. Stored events had no IP or full URL, and person-profile processing was false. The browser's native share stayed pending, so completed sharing was not verified in this check.

The initial marked QA events exposed the default GeoIP enrichment. After disabling that transformation, a fresh visit starting at `2026-10-05T06:17:10Z` had no city, latitude, IP, or full URL. Earlier QA events retain their enrichment and are excluded from product results.

A separate real-browser local receiver test of the same pinned SDK showed empty cookies, localStorage, and sessionStorage before and after capture. Only allowed properties reached the receiver; an intentionally added email field was stripped. Production storage inspection was unavailable through the browser tool, so storage evidence comes from that SDK check, while cloud ingestion and privacy fields were checked against actual production QA events.

The saved [collection engagement readout](https://us.posthog.com/project/646286/insights/2IZHwHcR) measures the rolling seven days using the visit-based formula above, excludes QA, and requires a matching visit start. Its setup check returned zero eligible visits and no percentage; QA is not reader evidence. This rolling report is operational, but the fixed launch evaluation window has not begun. Record its start and end only when audience promotion is authorized.

## Domain move — October 5

The tracking origin moved to `https://weirdstats.dev` with the [domain release](hosting.md). `config/analytics.json` `publicOrigin` must equal the site's public origin; the build rejects a mismatch, and the browser initializes only on that exact origin. `weird-stats.vercel.app` now redirects and never initializes analytics.

Project `646286` settings were checked the same day. Its Authorized URLs list was empty; it now contains `https://weirdstats.dev`. That list is bookkeeping for PostHog's toolbar and web tools, not an ingestion requirement, and the SDK here disables external loading anyway. Events carry no URL, host or referrer, so the saved readout and the internal/test-user cohort filter needed no change. IP discarding stayed on and replay stayed off.

A marked QA visit from the in-app browser on `weirdstats.dev` at 11:59 CDT stored `visit_started` with `qa: true` and no city, IP or URL. PostHog's automation flag (`$virt_is_bot`) was set on it, as it is on every event this project receives; see [Automation and test traffic](#automation-and-test-traffic). Four unmarked collection visits arrived between 11:51 and 11:56 CDT, after the origin switch and before this check; their source is unknown. They appear in the rolling operational readout but not in a launch window, which has not begun.

## Automation and test traffic

PostHog's automation classification (`$virt_is_bot`, traffic type "Automation", category `no_user_agent`) is set on every event this project has received, readers and QA alike. The pinned SDK sends `$raw_user_agent`, and `filterEvent` drops it because it is not allowlisted, so PostHog never sees a user agent. That flag says nothing about any one browser and must not be used as a filter: it would remove every visit.

The [launch decision](editorial/2026-10-05-launch-decision.md) excludes "recognized automation" from eligible visits. In practice that exclusion is the client-side `navigator.webdriver` gate, which keeps flagged automation from initializing analytics at all, plus `qa` marking for checks run in browsers that pass the gate. This mapping awaits Nate's acknowledgment; the decision rule itself is unchanged.

Unmarked visits on October 5, all before any launch window:

- 11:51–12:35 CDT: about ten visits of unknown origin after the move to `weirdstats.dev`, including the four noted above.
- 12:39:50–12:51:03 CDT: 72 visits (119 events, 8 eligible collection visits) from Claude's step 5 check, run in a Chrome without the automation flag and without `?qa=1`.

They remain in PostHog and inflate the rolling seven-day readout until they age out. A launch window chosen later starts after them.

## QA procedure

For people and agents checking the site.

- **Functional checks** (layout, interactions, keyboard, share controls) run on a local build, a preview, or an immutable deployment URL. Those origins never initialize analytics, and their in-site links stay on the same origin.
- **Event checks** run on production. Start at `https://weirdstats.dev/?qa=1` or a discovery page with `?qa=1`, confirm the "QA test mode" strip and the "QA · " title prefix, and move only through the site's own links. If either cue is missing, stop, do not follow any link, and record the time. Typed addresses, bookmarks, the 404 page and withdrawn pages drop the marker.
- **Record** the start and end time of each production check, so any unmarked leak can be dated and excluded.
- **Never share a QA address.** A copied address keeps `?qa=1` and would mark every visit made from it. Post and share only the canonical URLs the share button provides.
- **Do not open production unmarked** to confirm a fix, follow a deployment "Visit" link, or test a shared link. Use an unflagged browser on production only with `?qa=1`.

QA marking follows in-site navigation from the first production deployment that includes it; its date is recorded in the [hosting record](hosting.md) when it ships.
