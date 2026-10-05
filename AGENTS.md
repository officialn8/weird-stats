# weird.stats working conventions

This is an ongoing editorial product, not a finished landing page. Read `docs/v1-brief.md`, `docs/content-system.md`, and `docs/editorial/daily-workflow.md` before content or architecture changes.

- Always show the newest discovery first in the scrolling collection and feed. Use first release dates for published entries and first review dates for private drafts; edits to an older discovery must not bump it.
- Preserve the orange continuous-scroll identity and custom interactions. New discoveries can use reusable treatments without making all entries visually identical.
- New facts live in `content/entries/`. Generic record content is escaped; custom templates live in `src/exhibits/`. Never edit generated `dist/` or `review-dist/` as source.
- The user chose daily drafts for review. Automated editorial runs must not invent approval, publish, push, deploy, or silently change approved claims. Follow current human instructions if they explicitly change that scope.
- Research primary sources and record measurement period, source-check date, scope, unit, uncertainty, and calculations. Political comparisons require particular attention to denominators and interpretation. A passing validator does not prove a claim.
- Keep draft material out of the published build. Run `npm run check`, `npm test`, and `npm run build` for content-system changes. Inspect affected interactions on desktop/mobile for visual changes.
- Vercel deploys every push to `main` to production; other branches get preview deployments. Merging or pushing to `main` is a public release, even for docs-only changes, so do it only within explicit human release authorization. Do not change the Vercel Git integration or its repository access without explicit approval.
