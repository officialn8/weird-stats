# weird.stats

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary audience is readers seeking consequential public-interest discoveries: people who want to understand an unexpected relationship, who it affects, and why it matters. This audience priority was confirmed by Nate during Impeccable initialization on October 5, 2026.

The creator is the editorial reviewer. He reviews private discoveries and corrections, decides whether to keep, revise, or reject them, and separately authorizes public release.

## Product Purpose

An ongoing editorial publication that makes surprising numbers and relationships understandable, memorable, and worth retelling. Discoveries should change how a reader sees something, with clear explanations and evidence they can inspect.

Success means readers understand the finding and its essential qualifications, remember a meaningful discovery, and voluntarily continue exploring. Release approval, technical validation, and small qualitative checks do not establish broad demand or retention.

## Positioning

Combine source-backed discoveries with purposeful interactive explanations. Give consequential public-interest findings editorial priority, including uncomfortable implications about power, money, institutions, incentives, and everyday systems. Let evidence determine the conclusion.

Retain unrelated subjects and lighter discoveries for variety. The collection can be funny, disturbing, hopeful, or delightful; an entry does not need a cheerful finish. Familiar trivia with a more precise number is not a new discovery, and obscurity alone is not a reason to publish.

## Operating Context

Readers arrive at the continuous scrolling collection or an individual discovery link. They can reveal an answer directly, optionally guess on selected entries, inspect sources and calculations, share the discovery, and keep exploring. Guessing has no score, timer, or penalty; choosing a guess and revealing the answer remain separate actions.

The editorial workflow prepares daily private drafts for human review. Its documented cadence is 9 a.m. America/Chicago; scheduling is managed separately from this product record. Research candidates, review packets, approved revisions, and release manifests retain distinct roles. A daily draft is not a daily public update.

Use [the brief](docs/v1-brief.md), [content system](docs/content-system.md), and [daily workflow](docs/editorial/daily-workflow.md) for detailed procedures. The [October 5 editorial direction](docs/editorial/2026-10-05-editorial-edge.md) supplies the consequence-led selection standard. This record captures durable context; dated decisions and exact release records establish individual approval and publication history.

## Capabilities and Constraints

- The existing implementation generates static HTML, discovery pages, share images, chart CSVs, and a JSON feed at build time. It uses native HTML/CSS/JavaScript, Node.js 22 for generation, and Python 3 for local serving. Adding discoveries does not require a framework migration, database, or runtime content API.
- New discovery records live in `content/entries/`; custom compositions live in `src/exhibits/`; reusable forms live in `src/treatments/`. Generic record content is escaped. `dist/` and `review-dist/` are generated output, never source.
- Put the newest discovery first in both the collection and feed. Published entries use their first release date; private drafts use their first review date. Editing or rechecking an older entry must not move it to the top.
- Preserve purposeful custom interactions alongside reusable forms. Interaction should explain a relationship, scale, comparison, or mechanism; the static reading path must still make sense.
- Every finding needs primary-source research, scope, unit, measurement period, source-check date, essential uncertainty, and visible calculations where applicable. Distinguish measurements, estimates, specifications, calculations, and illustrative models. Political comparisons require explicit denominators and careful interpretation.
- Keep qualifications needed for truth beside the claim. Do not imply causation from a ratio or trend, manufacture precision, or let an illustration masquerade as measured data. A passing validator is not factual verification.
- Public output selects exact approved revisions pinned by an authorized release manifest. Keep drafts and review material out of the public build. Noindex does not make a remotely accessible review page private.
- Automation may research and prepare review packets; it may not invent approval, silently revise approved claims, publish, push, deploy, or contact others. New claims and corrections require an actual human decision.
- Every push or merge to `main` deploys production through Vercel, including documentation changes. Release and integration changes require explicit human authorization.
- Follow [launch analytics QA](docs/launch-analytics.md) before opening production: functional checks run locally or on previews; production event checks use a `?qa=1` address. Inspect affected desktop/mobile interactions for visual changes, and run the repository's required checks for content-system changes.

For local work, `npm run dev` serves the published edition at `http://localhost:63014`; `npm run dev:review` serves private editorial previews at `http://localhost:63214`, including `/review.html`. Source changes rebuild; the browser needs a refresh. Generator changes require restarting the dev process.

Accounts, personal collections, community features, live data feeds, and automatic publication are not established V1 capabilities. Future expansion requires its own product and evidence decisions.

## Brand Commitments

The name is **weird.stats**. Preserve the established orange continuous-scroll identity and custom interactions. Keep the collection varied rather than making every discovery visually identical.

The editorial voice is unabashedly honest, clear, and curious. Warmth and humor remain available without softening supported uncomfortable findings. Provocation is not a substitute for evidence. “A collection of wonderfully unnecessary discoveries” remains draft positioning in the brief, not a settled strategic tagline.

## Evidence on Hand

- `content/entries/` contains discovery records; `content/candidates/` and `content/research-runs/` preserve investigations, gaps, and rejected or deferred directions.
- `content/revisions/` and `content/releases/` preserve exact review, approval, and release evidence. Consult these records rather than assuming a working draft is public.
- `docs/editorial/` contains creator feedback, reader-check protocols, dated decisions, and asset provenance. Label prior exposure and actual responses; do not invent independent reader validation.
- `public/assets/` contains existing imagery, optional audio, and licensed fonts. Preserve credits and rights declarations; illustrative chip audio is not a replication of the cited experiment.
- [Launch analytics documentation](docs/launch-analytics.md) describes the cookieless event contract and verification limits. Event instrumentation is not evidence that the product has achieved retention or audience demand.

## Product Principles

1. Lead with discoveries that matter, and make their consequences understandable.
2. Let evidence set the conclusion; preserve scope and uncertainty even when they complicate the reveal.
3. Use interaction to make the finding tangible while preserving a clear direct-reading path.
4. Reward continued curiosity through varied subjects and treatments, with new discoveries first.
5. Keep human editorial judgment and explicit release authorization central as the publication grows.

## Accessibility & Inclusion

Support touch and keyboard operation, accessible reveal announcements, readable small-screen numbers and units, ordinary scrolling, and reduced motion. Sound is opt-in, with a complete silent experience. Motion should settle, and static states must remain legible. Charts expose numerical descriptions, underlying tables, and downloadable data. Label illustrative exaggeration where it could be mistaken for scale.

No additional audience-specific accessibility requirement or formal conformance target has been confirmed.
