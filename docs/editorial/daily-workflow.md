# Daily editorial workflow

The hosted site is the foundation of an ongoing publication. Preserve its orange identity, continuous scrolling, surprise/reveal rhythm, and custom interactivity while expanding the range of subjects. The user explicitly chose **daily drafts for review**, not automatic publication.

## Cadence

The Codex heartbeat `daily-weird-stats-editorial-desk` is active for 9 a.m. America/Chicago each day in this chat. It prepares work in this local repository and reports substantive new review packets or actionable corrections. It is an app automation, not a server-side Vercel cron job or a guarantee of unattended cloud availability. Check the automation card for run status if a batch is missed.

Aim for one strong finished draft per day, with short notes on additional candidates. Do not publish weak material to satisfy a quota. Build a reviewed backlog so the eventual daily publication cadence can survive research gaps. At present, public updates happen after the user approves an entry and authorizes its release; a daily draft is not a daily public update.

## Research → evidence → treatment → review → release

1. Read existing entries, previous research notes, and the brief. Avoid repeating the same underlying discovery with a different number.
2. Research a small varied batch. Include everyday perception, science, materials, culture, logistics, political institutions, spending, elections, and other public data where the evidence supports a clear discovery. Politics is welcome; topical outrage is not a substitute for a meaningful relationship.
3. Open primary sources. Record the exact supporting table, passage, experiment, or definition; distinguish the source's publication date, the measurement period, and today's verification date. Recalculate derived values. Note familiarity and the reason a reader might retell it. Do not invent reader validation.
4. Prepare one content record and a dated review note. Pick a reusable reveal, bar comparison, or line chart if it explains the idea. A custom interaction remains appropriate when the mechanism needs it; describe missing assets or code honestly. Do not force every entry into a chart card.
5. Validate and inspect the draft: `npm run check`, `npm test`, `npm run build:review`, then `npm run dev:review`. Include a concise explanation, visible qualification, sources, data table, and appropriate motion/silent fallback. Keep incomplete work in `draft`; use `review` for a complete review packet.
6. Give the user the preview and the editorial decision to make: keep, revise, or reject. Record their actual response. Do not mark a candidate approved because it passed a schema check.
7. Only after explicit approval, record `approval.by` and `approval.at`, set a timezone-bearing `publishedAt`, and change status to `published`. Build/test, review the intended release, and deploy only within the user's release authorization. Git integration remains separately pending approval; do not retry or bypass its earlier rejection.

## Political and changing data

Use primary datasets and definitions, include the measurement period in the presentation, and identify geography and population. State whether a number refers to people, residents, citizens, registered voters, ballots, seats, dollars, or another unit. Specify denominators, nominal versus inflation-adjusted money, estimates versus final counts, and revisions where relevant. Two primary references are required by the current political-chart validator; their quality and relevance still need editorial judgment.

Separate the measured relationship from political interpretation. Do not imply causation from a trend or ratio, confuse per-capita representation with individual voting power, or cherry-pick dates/scales to produce the desired conclusion. Compare consistent definitions; explain why those places or periods were chosen. A historical snapshot is acceptable when clearly dated. Do not label it current or live.

## Charts and interaction

Bar and line renderers currently support nonnegative values with zero baselines. Every view names its unit and range; changing measures explicitly changes the labeled scale. Line x coordinates must increase and are spaced by their actual numerical distances. Always provide the underlying table and CSV. Negative values, confidence intervals, multiple series, maps, and live feeds need deliberate renderer extensions and tests before use.

Use interaction to expose a relationship: toggle a denominator, compare two quantities, scrub a supported timeline, or reveal a mechanism. Keep optional guessing optional. The static reading path must make sense.

## Refresh and correction lane

Run `npm run content:status`. Review entries whose `reviewDue` has passed. Do not silently replace an approved claim with newly fetched data: prepare a correction or refresh draft, show the source/date change, and request review. Immutable historical snapshots can retain their historical period; checking their source again does not make them current estimates.

Write the daily packet under `docs/editorial/batches/YYYY-MM-DD.md`. Record what was opened, verified, calculated, rejected, drafted, and still uncertain. Check for an existing packet before starting another. Preserve concurrent edits. Daily runs must not approve, commit/push, publish, deploy, change integrations, or contact other people.
