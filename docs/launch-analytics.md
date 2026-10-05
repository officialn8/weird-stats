# Launch measurement

The [launch decision](editorial/2026-10-05-launch-decision.md) fixes the product threshold before promotion. Deployment itself does not start that evaluation window.

## Privacy and scope

PostHog is configured with `persistence: 'memory'`, `disable_persistence: true`, `person_profiles: 'never'`, and `ip: false`. There are no analytics cookies or persistent local/session-storage identifiers. We deliberately measure a single loaded page rather than identifying a person across visits. This uses the SDK's [memory persistence](https://posthog.com/docs/libraries/js/persistence), not its separate server-hash identity mode.

Autocapture, pageview/pageleave capture, recordings, surveys, performance capture, exceptions, rage/dead clicks, and feature-flag requests are disabled. The pinned SDK is served from our own build; external SDK extensions cannot load. An allowlist drops unrequested events and properties, including URL queries, referrers, browser metadata, and person updates. IP storage must also be disabled in the dedicated project before activation. No `identify` calls or email collection.

Tracking runs only at the configured production origin, on the collection and released discovery pages. It does not initialize on localhost, previews, review pages, 404s, or withdrawn pages. Do Not Track, Global Privacy Control, and the browser automation flag disable it. A blocked or failed analytics request never blocks a reveal or share.

Configuration: `config/analytics.json`. The project ingestion token is public client configuration, not a personal API credential. `enabled: false` omits analytics initialization and the SDK from generated pages. Rebuild and manually deploy after activation. Never place a personal API key here. See [PostHog configuration](https://posthog.com/docs/libraries/js/config) for the SDK option definitions.

## Event contract, version 1

Every event includes a random memory-only `visit_id`, `page_kind` (`collection` or `discovery`), `available_reveals`, `schema_version`, and `qa`. Add `?qa=1` to production checks; exclude these events from product results. Page reload/navigation creates a new visit ID. Browser back-forward cache restoration retains that page visit.

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

## Activation checklist

Status on October 5: PostHog reports only the existing `Portfolio` project in `Projects LLC`. A question to Nate is pending about creating `weird.stats` there. No project was created or existing project altered without that choice. Production remains disabled. A real-browser local receiver test of the pinned SDK showed empty cookies, localStorage, and sessionStorage before/after capture. The emitted payload contained only allowed properties; an intentionally added email field was stripped. This confirms the local SDK boundary, not cloud ingestion.

1. Confirm the dedicated PostHog project in the intended organization, get its public ingestion token and region, and disable IP storage.
2. Set the token/host and enable the checked-in configuration. Build and deploy.
3. In an ordinary browser, visit production with `?qa=1`, reveal two different entries, scroll onward, and use a share action. Check that the marked events arrive in the correct project with the contract above and without identifying fields. Check cookie/local/session storage before and after.
4. Create the launch readout from the verified event schema. Only then treat measurement as operational. A unit test or successful deploy is not proof of PostHog ingestion.
