# Hosting setup

Set up October 4, 2026.

## Current release — custom domain weirdstats.dev, October 5

The six-discovery edition is live at https://weirdstats.dev. Nate authorized the commit and production deployment. Editorial content is unchanged: before deploying, the live feed entries and the collection, runway and mail pages matched the new build apart from the origin.

- Domain: `weirdstats.dev` was registered at Namecheap on October 5 with nameservers `ns1.vercel-dns.com` and `ns2.vercel-dns.com` (registry RDAP, no DS records). It is the apex production domain of the `weird-stats` project; `www.weirdstats.dev` is a 308 redirect to the apex.
- The canonical public origin is `https://weirdstats.dev`: the `PUBLIC_SITE_ORIGIN` default, `config/analytics.json` `publicOrigin`, and canonical, share-image and feed URLs. Analytics only initializes on this exact origin.
- `vercel.json` 308-redirects every path on `weird-stats.vercel.app` to the same path on `weirdstats.dev`. Immutable deployment URLs are unaffected.
- Deployment: https://weird-stats-7jpc1odh7-nathaniels-projects-cc0e35b9.vercel.app from `16e5056` on `chore/weirdstats-domain`, deployed with `vercel deploy --prod --yes`, aliased to all three hosts. All 85 tests and the build passed.
- Verified over HTTPS against the apex A record (216.198.79.1): Let's Encrypt certificate for `weirdstats.dev`, valid to January 3, 2027; collection, discovery page, asset, share PNG and feed return 200; `/review.html` and unknown paths return the 404 page; `www` redirects to the apex. Old-host paths, including `/` and slash-ended pages, reach the same page on the new domain in one redirect.
- DNS propagation was partial at release: Google, Quad9 and OpenDNS resolved the apex; Cloudflare 1.1.1.1 still returned intermittent SERVFAIL from its cache of the period before Vercel served the zone. After release, the in-app browser loaded the collection on `weirdstats.dev` with styles and artwork intact, and a marked QA visit from it was stored in PostHog; see [launch analytics](launch-analytics.md).
- A misspelled `weidstats.dev` (plus `www.`) was added in the dashboard before this release. It is unregistered and should be removed from the project and team; its current state was not rechecked.

### Interim deployment and partial outage

The first domain deployment, `weird-stats-2w3kbbuu2` from `e26915d`, was live for about ten minutes before the fix. Its redirect source `/:path*` is compiled strictly when `trailingSlash` is enabled, so it skipped `/` and every slash-ended page but redirected assets, share images, CSVs and the feed. Because `weirdstats.dev` did not resolve yet, pages on `weird-stats.vercel.app` loaded without images, fonts or scripts. The fix uses `/:path(.*)`, checked against Vercel's route compiler before deploying. No rollback was performed. Browsers may have cached those permanent asset redirects; they now resolve to identical files.

## Earlier release — analytics activation, October 5

The five-entry edition remains live at https://weird-stats.vercel.app, now with the separately authorized PostHog project enabled.

- Source commit: `efa73c6` on `fix/editorial-reveal-review`, backed up to the private GitHub branch.
- Deployment: `dpl_AFeSB5BmZuJEJZeS3VV8bckCrqT1`, production, build succeeded and main alias assigned.
- Immutable URL: https://weird-stats-kjykzkqgb-nathaniels-projects-cc0e35b9.vercel.app.
- Deployed with `vercel deploy --prod --yes --scope nathaniels-projects-cc0e35b9`. Git integration and protection settings were unchanged.
- All 76 tests and both builds passed before deployment. The configuration change enables the public ingestion token and US host; it makes no editorial changes.
- Actual marked browser events reached project `646286`. IP storage and GeoIP enrichment are disabled. See [launch analytics](launch-analytics.md) for the stored-event evidence, SDK storage check, saved readout, and coverage limits.
- No audience promotion occurred.

## Earlier five-entry release — October 5

Nate approved all four pending proposals and authorized deployment in the [launch decision](editorial/2026-10-05-launch-decision.md). The five-entry edition is live at https://weird-stats.vercel.app.

- Deployment: `dpl_5pifowr2twQrgXFfuXVmW4Dezz1N`, target production, status Ready.
- Immutable URL: https://weird-stats-f8ibh7wrn-nathaniels-projects-cc0e35b9.vercel.app.
- Uploaded the working tree from `fix/editorial-reveal-review` based on `572a0a3`, including this turn's exact approval records, runtime changes, and disabled analytics configuration. Do not describe the preexisting commit alone as the deployed source.
- Built with `--prod --skip-domain`, checked via authenticated `vercel curl`, then promoted to the main alias. No protection settings or Git repository access changed.
- Anonymous checks: collection, five discovery pages, five 1200×630 PNGs, feed, and Senate CSV returned 200. `/review.html`, raw content JSON, and an unknown discovery returned the real 404 page.
- The updated chip was exercised in the production browser; no console errors. The Senate's optional guess and keyboard reveal passed at 390px locally, with no horizontal overflow.
- Four share PNGs match the Mac build byte for byte. The mule PNG differs in encoded bytes between hosted/local builds; the hosted image was inspected and correctly shows the new question and mule artwork. No social-platform cache/preview scrape has been performed.
- All 76 tests and both builds passed. At this earlier deployment, PostHog was implemented but disabled pending the project decision and ingestion verification. No audience promotion occurred.

## Original setup

- Workspace and repository root: `/Users/nate/weird.stats`.
- GitHub: https://github.com/officialn8/weird-stats (private), branch `main`.
- Vercel project: https://vercel.com/nathaniels-projects-cc0e35b9/weird-stats.
- Site alias: https://weird-stats.vercel.app.
- First deployment: `dpl_AoBGxucc2gA6qZfeGf18ikTc7iaF`, Vercel reported `READY`.
- Vercel team: Nathaniel’s projects (`nathaniels-projects-cc0e35b9`).
- Production alias is public: an anonymous HTTP GET on October 5, 2026 returned 200 and the original site HTML. The earlier protection assumption was incorrect. Preview URLs need their own access check.

The project uses the repository root, no framework, `npm run build`, and `dist/`. The build emits the selected public edition to `dist/` and requires no environment variables. The Vercel CLI created an ignored local `.env.local` for its own authentication workflow; do not commit it or `.vercel/`.

## Git integration: pending

Automatic approval review rejected connecting Vercel to this private repository because that would grant ongoing external-service access. No workaround was used. The initial deployment was uploaded directly through the authenticated Vercel CLI. The GitHub build workflow is active, but pushes are not wired to Vercel deployments yet.

After the user specifically approves Vercel access to `officialn8/weird-stats`, connect only that repository to the existing Vercel project. Do not expand access to unrelated repositories. If the GitHub app installation needs a repository-selection change, confirm its scope is restricted to this repository.

## Manual deployment

From the repository root:

```sh
npm ci
npm run build
npx vercel deploy --target=preview --scope nathaniels-projects-cc0e35b9
```

The first deploy command did not request production, but Vercel’s first-deployment behavior assigned it to production automatically. Explicitly select preview for future review deployments. A production deployment updates the already-public site immediately. Release/deployment authorization and any protection change remain separate decisions.

## Verification

The local build passed. All 15 site files in `public/` matched the approved visual prototype byte for byte at setup. The build output excludes research documents and archives. GitHub’s initial Node 22 build workflow passed. Vercel reported the uploaded deployment ready; the hosted page itself was not fetched or browser-tested during setup.
