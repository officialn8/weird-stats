# Hosting setup

Set up October 4, 2026.

## Current release — October 5

Nate approved all four pending proposals and authorized deployment in the [launch decision](editorial/2026-10-05-launch-decision.md). The five-entry edition is live at https://weird-stats.vercel.app.

- Deployment: `dpl_5pifowr2twQrgXFfuXVmW4Dezz1N`, target production, status Ready.
- Immutable URL: https://weird-stats-f8ibh7wrn-nathaniels-projects-cc0e35b9.vercel.app.
- Uploaded the working tree from `fix/editorial-reveal-review` based on `572a0a3`, including this turn's exact approval records, runtime changes, and disabled analytics configuration. Do not describe the preexisting commit alone as the deployed source.
- Built with `--prod --skip-domain`, checked via authenticated `vercel curl`, then promoted to the main alias. No protection settings or Git repository access changed.
- Anonymous checks: collection, five discovery pages, five 1200×630 PNGs, feed, and Senate CSV returned 200. `/review.html`, raw content JSON, and an unknown discovery returned the real 404 page.
- The updated chip was exercised in the production browser; no console errors. The Senate's optional guess and keyboard reveal passed at 390px locally, with no horizontal overflow.
- Four share PNGs match the Mac build byte for byte. The mule PNG differs in encoded bytes between hosted/local builds; the hosted image was inspected and correctly shows the new question and mule artwork. No social-platform cache/preview scrape has been performed.
- All 76 tests and both builds passed. PostHog is implemented but disabled pending the project decision and actual ingestion verification. No audience promotion occurred.

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
