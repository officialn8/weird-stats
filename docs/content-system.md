# Content system

The site is generated at build time from small content records. There is no database or browser-side content fetch required.

## Authoring

```sh
npm run content:new -- a-new-discovery reveal
npm run content:new -- a-new-comparison bar
npm run content:new -- a-new-timeline line
npm run content:status
npm run dev:review
```

The scaffolder refuses to overwrite existing files. Complete one JSON file in `content/entries/`. The authoritative validator and renderers live in `scripts/content.mjs`; `same-two-seats.json` is a complete published paired-comparison example.

Common fields: stable `id`, `title`, `topic`, `status`, `order`, and `treatment`. Reviewable entries require evidence kind, scope, measurement period (`dataAsOf`), source-check date (`checkedAt`), review due date, and primary source references. Reusable entries also require question, answer, explanation, qualification, and why the discovery matters.

- `draft`: incomplete; absent from all rendered editions.
- `review`: complete enough to inspect; included only in the local editorial edition.
- `published`: records an approved revision and its approval timestamp; public inclusion requires a separate due release-manifest pin.
- `retired`: excluded from both editions; history remains in Git.

Changing status is an editorial action, not an automatic conclusion of validation. Never fabricate an approval. Original snapshots retain their carried-forward approval and October 4 release provenance. On October 5, Nate explicitly approved the four pending proposals and authorized deployment: new chip copy, new mail/painting share questions, and the Senate comparison. Copper retains its previous approval. See the [launch decision](editorial/2026-10-05-launch-decision.md) and exact manifest pins. These approvals are not independent reader validation.

## Treatments

`reveal` uses native accessible disclosure. `bar` and `line` place all chart content inside the same initially closed native reveal: chart views, optional measure buttons, an accessible numerical description, a full data table, and downloadable CSV. Each view declares `id`, `label`, `unit`, `baseline: 0`, positive `max`, explanatory `note`, and at least two values with a label and finite nonnegative value. Lines also require increasing numeric `x` coordinates. Example: use actual years for time rather than evenly spacing irregular observations.

`bearing-shift` is a full-scene runway study backed by record copy. It holds a south-facing runway fixed (`trueBearing: 180`) while an illustrative magnetic heading moves from `from` to `to`, crossing one rounded runway-number boundary. The validator requires a positive change of at most 10°, finite headings in 0–360°, a 1–8 second `duration`, and an explicit `exampleLabel`. These inputs illustrate the mechanism; they must not be presented as measured airport headings without evidence. Its native reveal, visibility-gated motion, slider, replay, and static explanation share the site's motion controls. This is a narrow mechanism, not a general map or live aviation-data template. The `runway-north` record is a private review example, not a released entry.

The original chip, copper, mail, and painting experiences are separate `custom` templates in `src/exhibits/`, referenced by their content records. These bespoke templates currently retain their copy and source disclosures in HTML; JSON stores their catalog/evidence metadata. They are intentionally not flattened into a generic renderer. Adding a new bespoke mechanism still needs its own template and behavior. Reusable reveals and charts need only a record.

The shell lives in `src/shell.html`. Runtime assets and scripts live in `public/`. `public/index.html` no longer exists: the build creates the page, its ordered entries, a single primary heading, and `feed.json`. The feed contains only that edition's included entries; it is not an RSS feed or live API.

## Build boundary

`npm run build` creates `dist/` from the exact approved snapshots pinned in `content/releases/current.json`, once the manifest is due. Review markup, draft records, and their generated CSVs do not enter that edition. `npm run build:review` creates `review-dist/`, includes review entries, shows a draft banner, and adds noindex metadata. The review output is ignored by Git and Vercel and is never deployed by the normal build. Noindex is not access control: keep that preview local unless the user explicitly authorizes sharing it.

Selection happens at build time. A future publication timestamp alone does not trigger a rebuild or deployment. The daily automation prepares drafts; it does not publish them. No scheduled Vercel release pipeline is active. Git auto-deployment remains pending separate repository-access approval.

The dev server rebuilds when content, templates, or public files change; refresh the browser to see the update. It serves the published edition on port 63014 and editorial edition on 63214, bound to localhost. Override with `PORT` if occupied. Restart the dev process after changing generator code under `scripts/`. Python 3 serves files; Node 22 performs generation and change detection.

## Extending and testing

Unit tests use fictional records from `tests/fixtures/entries.mjs`, never an editorial draft. The build accepts optional `records` and an `output` directory URL; every test build supplies both and writes to a temporary folder removed afterward. Tests never rebuild `dist/` or `review-dist/`. Rejecting or deleting a draft therefore cannot invalidate implementation tests. Live editorial records remain validated by `npm run check` and normal builds.


`npm test` covers publication gating, draft leakage, source requirements, invalid chart domains, irregular time spacing, HTML escaping, CSV export, stale-review reporting, and reordered next links. `npm run check` validates content, assets, and local anchors. These are implementation checks, not factual verification. Source verification and editorial review remain separate work.

At larger scale, add pagination/archives before loading hundreds of bespoke scenes in one page. A CMS can later supply the same record shape; it is not required to establish this editorial workflow.

## Reusable forms and page context

`scripts/content.mjs` owns common evidence rules. `src/treatments/registry.mjs` owns each treatment's `validate(entry)`, `render(entry, context)`, owned `assets` and `scripts`, and whether it exports data. A renderer returns the graphic inside the shared native reveal; custom adapters return their whole scene. New kinds register before loading records. Political denominator, methodology and primary-source requirements run before **every** treatment, including plain reveals and custom scenes.

`createPageContext()` supplies asset, CSV, discovery and onward URLs. Renderers receive an explicit page context; URLs to public assets and data start at `/`, so nested pages remain valid. Optional `guess.choices` records contain stable `id`, `label`, and `feedback`. Guess buttons select locally; the reader still controls the separate direct reveal. Feedback stays inside the closed reveal. `window.WeirdDiscoveries.initialize(entry)` scopes controls to an entry and returns cleanup; `observeVisual(visual, callbacks)` separates visibility/motion from reveal state and returns observer cleanup. A second instance of a form needs no global IDs or shared guess state.

## Owned assets and revision boundary

The build copies an explicit shared shell list plus assets/scripts owned by selected treatments and records (`assets: [{path: "assets/example.webp", ...provenance}]`). It no longer copies all of `public/`. Custom chip audio and copper's generated pennies are declared even though runtime code creates them. Scene preloads are emitted only where needed. Missing or referenced-but-unowned files fail before existing output is removed. Put private research media outside `public/`; an unselected record's declared media is never copied by mere directory membership.

The minimal release contract lives in `content/releases/README.md`: `selectRelease` selects pinned approved snapshots and authorized withdrawals, and `contentDigest` binds editorial copy, evidence, quantitative treatment, guess feedback, declared assets and asset bytes. Custom visible text, accessible labels and external source links participate; markup and runtime refactors do not. A release build checks the actual emitted custom fragment and assets against its pin. Approval alone cannot advance a supplied release manifest. Production builds now require the verified disk manifest and approved snapshots in `content/revisions/approved/`. Missing pins, changed editorial content, changed asset bytes or missing incorporated-material rights fail before replacing existing output. Injected fictional build records retain isolated status-based selection when no test manifest is provided.

## Individual discovery pages and sharing

Every selected discovery now generates `/discoveries/<id>/index.html`, a slash-ended canonical URL, and a 1200 × 630 PNG at `/share/<id>.png`. The page contains the same scene and ends with “Keep wandering” to `/`. All entries remain on the continuous-scroll home page in this stage, so existing `/#id` links still work. Vercel's `trailingSlash: true` handles slashless routes; there is no SPA rewrite. Unknown paths use `404.html`. A previously released, authorized withdrawal retains a safe notice at its discovery route and emits no entry PNG or CSV.

`PUBLIC_SITE_ORIGIN` defaults to `https://weird-stats.vercel.app`. It must be an HTTPS origin with no credentials, path, query, or fragment. Metadata always uses this public origin even in the local review build, which remains noindex and private. A local draft's canonical URL is its intended eventual address, not evidence that it has been published. The public feed uses canonical discovery URLs.

Public share controls live outside the answer/guess state. The private review build supplies local preview/review links and does not offer the production share button. Native sharing is preferred; otherwise the button copies the canonical link and announces “Link copied.” If clipboard access fails, it exposes and selects a readonly URL. The ordinary permalink remains usable without JavaScript. Neither the selected guess nor revealed state enters the URL.

`shareCopy(entry)` in `scripts/share-copy.mjs` supplies question-led metadata. Reusable forms default to their question; custom scenes have explicit neutral defaults. Optional `share.question` and `share.description` override them. This effective share copy participates in `contentDigest`, so changing a default or override changes the editorial revision. Review must still check for spoilers; a validator cannot determine whether wording gives the answer away. New default copy has not received inferred editorial approval.

Share PNGs use original geometric artwork and bundled Outfit type under `public/assets/OFL-Outfit.txt`. The exact build-only dependency `@resvg/resvg-js@2.6.2` is locked, uses the bundled font with system fonts disabled, and receives no image or remote font URLs. All HTML, PNG, CSV and feed generation uses the same selected catalog, including the local review selection. The build validates assets and renders images before replacing its previous output.

Local Node 22 generation and fixture tests establish file-level behavior. Deployment routing, anonymous crawler/image access and an actual social preview still require an authorized deployment after U7 baseline migration. Local or protected-preview success is not proof of public sharing.


## Exact revision review and release

`npm run content:review -- report` and `npm run content:status -- --json` expose the same packet instance IDs, content digests, baseline conflicts, claim/data/source differences and readiness gaps. `npm run dev:review` serves the private index at `http://localhost:63214/review.html`. The review index leads with the share image and exact preview; raw diffs and revision IDs sit in a collapsed disclosure. Each prepared packet has its own `/review/<id>/<packetId>/` preview and, for a chart, its own CSV. Multiple proposals never silently share a preview. The review collection uses a single eligible pending proposal when there is exactly one for an ID; with multiple proposals it retains the released baseline and uses the exact packet links for review. Pending revision packets share the five-packet ceiling with draft work. No review routes, packet index or packet-only assets are generated by a public build. A noindex page is still private only while served locally.

Prepare a JSON input containing `entry` (status `draft` or `review`), `baselineDigest` (the current approved digest, or `null` for a new discovery), and optional custom `fragment`. Run `npm run content:review -- propose /private/tmp/packet.json`. The command captures asset identities and the current working-record hash. The content `digest` names editorial content; the separate `packetId` names this review instance, including its baseline and draft/review readiness context. Existing legacy packets keep their digest as their packet ID. Decisions and preview links use `packetId`; a content digest is accepted by the command only when it resolves unambiguously. Repeating an active, unchanged context returns the same packet. Resubmitting after closure creates a new instance and preserves earlier decisions. It refuses an obsolete approved baseline. An incomplete `draft` can be recorded, but cannot be kept as approved.

After an actual human response, use `npm run content:review -- decide ID PACKET_ID keep /private/tmp/human.json` (or `revise` / `reject`). The human JSON requires `by`, a timezone-bearing `at`, `inputReference` identifying the actual response, and `note`. Those fields are an audit contract, not identity authentication; neither tests nor a successful command supply human permission. The exact packet and working baseline must still match. Keep writes an approved immutable editorial snapshot and updates its working record/custom fragment; if that digest already exists, it reuses the original snapshot and preserves its first approval, publication timestamp and provenance; it does not change the release manifest. Rejection preserves an existing released snapshot. A rejected new draft is retired and its candidate disposition closes, so it disappears from review and the unfinished queue. Revise records the requested work; prepare a replacement for another decision. Reconciled replacements automatically supersede revised or stale same-entry packets, with a recorded predecessor/successor link, and transfer their queue capacity. A fully populated draft resubmitted as review also gets a new instance. Optional `supersedes: [packetId]` explicitly replaces other active same-entry alternatives. Keeping one alternative supersedes its unreviewable siblings. Old packets and human decisions remain on disk. To close a correction packet without replacing it, use `npm run content:review -- close ID PACKET_ID /private/tmp/human.json`; this preserves its history and leaves the working record untouched. A separate unfinished draft still needs completion or rejection.

Approval B while A is released keeps A in collection HTML, discovery pages, metadata, images, CSV and feed. The working custom fragment may hold approved B; public output then uses A's stored fragment. When working and released revisions agree, equivalent layout/runtime markup is used. Unapproved working copy changes fail validation. Asset bytes are not archived by this small system: replacing an asset still used by A fails the build until that pinned identity is restored. Use a new asset path for B so both can coexist.

Only a separate human release authorization permits `npm run content:review -- release /private/tmp/release.json`. Its input contains `entries: [{id, digest}]`, `withdrawals`, `expectedManifest` (the report's manifest digest), and `human` in the above shape. It pins approved revisions and records release evidence; it never deploys or reconnects Git integration. Rebuild and deployment remain separate authorized actions. An obsolete manifest digest conflicts rather than replacing another release. Every previously public ID must remain pinned or explicitly withdrawn. Existing withdrawal notices remain until an explicit restoration pin replaces them. Re-releasing a revision preserves its first release evidence.

All command writers use `content/.editorial.lock`. Files are replaced atomically one at a time, not through a multi-file database transaction. An interruption during approval can leave a new snapshot and an old working record/fragment; the public build fails on disagreement. Do not delete a stale lock until its recorded PID is confirmed stopped. Preserve the partial files, compare the recorded human input and approved snapshots, restore the matching record/fragment pair, then prepare a fresh packet if reconciliation is needed. Never infer approval from a partial snapshot or bypass the build check. Arbitrary external file writes that ignore the lock remain outside this command contract.

Declared incorporated assets use `assets: [{path, rights: {basis, source, attribution}}]`. Reused datasets use `dataReuse: [{source, scope, rights: {basis, source, attribution}}]`. These declarations and asset byte identities participate in approval. Missing/unknown rights block the incorporated material's release; an ordinary outbound citation needs no reuse license declaration. A declaration is not independent legal or factual verification. Shared original share-card artwork and the bundled Outfit font remain documented build assets; preserve the font license.

The carry-forward migration uses the verified hosted baseline documented in [release evidence](editorial/release-baseline.md), not the current checkout. Its asset declarations are documented in [provenance](editorial/asset-provenance-check.md). The new share surfaces are **unreleased presentation**. The mail and painting baseline headings are truthful original copy, but are not question-led social teasers; the painting heading also reveals the scale. Their pending metadata proposals need human review before rollout can satisfy the question-led, spoiler-free sharing requirement. No migration record claims that this new route/share presentation has been authorized for deployment.

Share PNGs use the bundled static Outfit Bold face and existing owned scene artwork. Sharp converts WebP to embedded PNG in memory, and Resvg renders the final image. The build is asynchronous and finishes image generation before replacing output. Exact private previews also include their own share PNG; none of those private paths enter public output.
