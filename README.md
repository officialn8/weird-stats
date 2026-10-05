# weird.stats

A scrolling collection of wonderfully unnecessary discoveries. Orange, tactile, and curious, with optional sound and accessible reveals.

[Hosted site](https://weird-stats.vercel.app) · [Private GitHub repository](https://github.com/officialn8/weird-stats) · [Vercel project](https://vercel.com/nathaniels-projects-cc0e35b9/weird-stats)

The current site contains chips and auditory perception, copper in coins, mule mail to Supai, and the scale of the Night Watch photograph. This is the first hosted version, not a settled launch lineup.

## Work on the site

Use Node.js 22 for checks/builds and Python 3 for the local server:

```sh
npm ci
npm run dev
```

Open http://localhost:63014 for the published edition, or run `npm run dev:review` and open http://localhost:63214 for unpublished review entries. Source edits rebuild automatically; refresh to see them. No framework or runtime content API is required.

- `content/entries/`: one discovery per JSON record, including status, evidence, dates, and visual treatment.
- `src/shell.html`: shared page layout.
- `src/exhibits/`: the four original custom interactive compositions.
- `public/`: shared CSS, browser behavior, and local assets.
- `scripts/content.mjs`: validation, publication selection, and reusable reveal/bar/line renderers.
- `dist/`: generated published site. `review-dist/`: generated local editorial edition. Neither is committed.
- `docs/`: editorial workflow, evidence, reader responses, design history, and hosting notes.

See [the content system](docs/content-system.md) for adding entries, and [the daily workflow](docs/editorial/daily-workflow.md) for the 9 a.m. Central draft/review cadence. The user reviews new entries before publication.

```sh
npm run content:new -- a-new-fact bar
npm run content:status
npm test
npm run build
```

## Deployment

Vercel uses the repository root, the Other framework preset, `npm run build`, and the `dist` output directory. `vercel.json` records these settings. No environment variables, database, paid integration, or runtime service is required.

The GitHub workflow runs the build on pushes and pull requests. The initial direct-upload deployment is ready. Vercel assigned this first deployment to production automatically and gave it the `weird-stats.vercel.app` alias. Deployment protection remains enabled.

**Git integration is pending approval:** Vercel is not yet authorized to access this private GitHub repository, so Git pushes do not currently deploy the site. Once connected, branch changes receive previews and the configured production branch supplies production deployments. Until then, deploy from the repository root with the Vercel CLI. Use `--target=preview` explicitly for previews. See [hosting setup](docs/hosting.md).

Research documents, unpublished entries, and their CSV exports are excluded from `dist/`. Drafts are available only in the separate local editorial build. Asset URLs are not fingerprinted, so their cache lifetime is short and must revalidate after expiry.

## Editorial and asset standards

Start with [the brief](docs/v1-brief.md), [the editorial reset](docs/editorial/2026-10-04-editorial-reset.md), and [the prepared chip reader check](docs/editorial/2026-10-04-chip-visual-check.md). Each discovery needs a source, a scope, an honest qualification, and a reason to care. Reader feedback is not the same as independent validation.

The chip audio is an illustrative comparison, not a replication of the study; playback is opt-in and the reveal also works silently. [Audio and image provenance](docs/prototypes/visual-studies/assets/chip-audio.md) records the CC0 audio edits. The site carries source/credit disclosures; Outfit's SIL license ships with the font. No open-source license has been assigned to the project itself.
