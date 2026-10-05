# Hosting setup

Set up October 4, 2026.

- Workspace and repository root: `/Users/nate/weird.stats`.
- GitHub: https://github.com/officialn8/weird-stats (private), branch `main`.
- Vercel project: https://vercel.com/nathaniels-projects-cc0e35b9/weird-stats.
- Site alias: https://weird-stats.vercel.app.
- First deployment: `dpl_AoBGxucc2gA6qZfeGf18ikTc7iaF`, Vercel reported `READY`.
- Vercel team: Nathaniel’s projects (`nathaniels-projects-cc0e35b9`).
- Deployment protection left enabled. Access may require Vercel sign-in.

The project uses the repository root, no framework, `npm run build`, and `dist/`. The build serves only `public/` and requires no environment variables. The Vercel CLI created an ignored local `.env.local` for its own authentication workflow; do not commit it or `.vercel/`.

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

The first deploy command did not request production, but Vercel’s first-deployment behavior assigned it to production automatically. Explicitly select preview for future review deployments. A deliberate public launch or protection change remains a separate decision.

## Verification

The local build passed. All 15 site files in `public/` matched the approved visual prototype byte for byte at setup. The build output excludes research documents and archives. GitHub’s initial Node 22 build workflow passed. Vercel reported the uploaded deployment ready; the hosted page itself was not fetched or browser-tested during setup.
