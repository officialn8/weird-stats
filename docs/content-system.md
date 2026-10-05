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

The scaffolder refuses to overwrite existing files. Complete one JSON file in `content/entries/`. The authoritative validator and renderers live in `scripts/content.mjs`; `same-two-seats.json` is a complete review-stage example.

Common fields: stable `id`, `title`, `topic`, `status`, `order`, and `treatment`. Reviewable entries require evidence kind, scope, measurement period (`dataAsOf`), source-check date (`checkedAt`), review due date, and primary source references. Reusable entries also require question, answer, explanation, qualification, and why the discovery matters.

- `draft`: incomplete; absent from all rendered editions.
- `review`: complete enough to inspect; included only in the local editorial edition.
- `published`: requires an approval record and publication timestamp; included in the normal build once that timestamp is reached.
- `retired`: excluded from both editions; history remains in Git.

Changing status is an editorial action, not an automatic conclusion of validation. Never fabricate an approval. The four existing entries carry an explicit “Existing hosted edition carried forward” record; this is not new reader validation.

## Treatments

`reveal` uses native accessible disclosure. `bar` and `line` place all chart content inside the same initially closed native reveal: chart views, optional measure buttons, an accessible numerical description, a full data table, and downloadable CSV. Each view declares `id`, `label`, `unit`, `baseline: 0`, positive `max`, explanatory `note`, and at least two values with a label and finite nonnegative value. Lines also require increasing numeric `x` coordinates. Example: use actual years for time rather than evenly spacing irregular observations.

The original chip, copper, mail, and painting experiences are separate `custom` templates in `src/exhibits/`, referenced by their content records. These bespoke templates currently retain their copy and source disclosures in HTML; JSON stores their catalog/evidence metadata. They are intentionally not flattened into a generic renderer. Adding a new bespoke mechanism still needs its own template and behavior. Reusable reveals and charts need only a record.

The shell lives in `src/shell.html`. Runtime assets and scripts live in `public/`. `public/index.html` no longer exists: the build creates the page, its ordered entries, a single primary heading, and `feed.json`. The feed contains only that edition's included entries; it is not an RSS feed or live API.

## Build boundary

`npm run build` creates `dist/` from published, due entries only. Review markup, draft records, and their generated CSVs do not enter that edition. `npm run build:review` creates `review-dist/`, includes review entries, shows a draft banner, and adds noindex metadata. The review output is ignored by Git and Vercel and is never deployed by the normal build. Noindex is not access control: keep that preview local unless the user explicitly authorizes sharing it.

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

The minimal release contract lives in `content/releases/README.md`: `selectRelease` selects pinned approved snapshots and authorized withdrawals, and `contentDigest` binds editorial copy, evidence, quantitative treatment, guess feedback, declared assets and asset bytes. Custom visible text, accessible labels and external source links participate; markup and runtime refactors do not. A release build checks the actual emitted custom fragment and assets against its pin. Approval alone cannot advance a supplied release manifest. Production baseline migration is deliberately pending U7; without a manifest this intermediate build still uses the prior published-status selection, and does **not** claim production revision protection.

## Individual discovery pages and sharing

Every selected discovery now generates `/discoveries/<id>/index.html`, a slash-ended canonical URL, and a 1200 × 630 PNG at `/share/<id>.png`. The page contains the same scene and ends with “Keep wandering” to `/`. All entries remain on the continuous-scroll home page in this stage, so existing `/#id` links still work. Vercel's `trailingSlash: true` handles slashless routes; there is no SPA rewrite. Unknown paths use `404.html`. A previously released, authorized withdrawal retains a safe notice at its discovery route and emits no entry PNG or CSV.

`PUBLIC_SITE_ORIGIN` defaults to `https://weird-stats.vercel.app`. It must be an HTTPS origin with no credentials, path, query, or fragment. Metadata always uses this public origin even in the local review build, which remains noindex and private. A local draft's canonical URL is its intended eventual address, not evidence that it has been published. The public feed uses canonical discovery URLs.

Share controls live outside the answer/guess state. Native sharing is preferred; otherwise the button copies the canonical link and announces “Link copied.” If clipboard access fails, it exposes and selects a readonly URL. The ordinary permalink remains usable without JavaScript. Neither the selected guess nor revealed state enters the URL.

`shareCopy(entry)` in `scripts/share-copy.mjs` supplies question-led metadata. Reusable forms default to their question; custom scenes have explicit neutral defaults. Optional `share.question` and `share.description` override them. This effective share copy participates in `contentDigest`, so changing a default or override changes the editorial revision. Review must still check for spoilers; a validator cannot determine whether wording gives the answer away. New default copy has not received inferred editorial approval.

Share PNGs use original geometric artwork and bundled Outfit type under `public/assets/OFL-Outfit.txt`. The exact build-only dependency `@resvg/resvg-js@2.6.2` is locked, uses the bundled font with system fonts disabled, and receives no image or remote font URLs. All HTML, PNG, CSV and feed generation uses the same selected catalog, including the local review selection. The build validates assets and renders images before replacing its previous output.

Local Node 22 generation and fixture tests establish file-level behavior. Deployment routing, anonymous crawler/image access and an actual social preview still require an authorized deployment after U7 baseline migration. Local or protected-preview success is not proof of public sharing.
