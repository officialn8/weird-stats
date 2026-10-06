# Daily editorial workflow

The hosted site is the foundation of an ongoing publication. Preserve its orange identity, continuous scrolling, surprise/reveal rhythm, and custom interactivity while expanding the range of subjects. The user explicitly chose **daily drafts for review**, not automatic publication.

New discoveries go at the top of the continuous-scroll collection automatically. Prepare an exact review packet so the preview has a stable first-review date; do not use manual `order` edits or source-check dates to promote older discoveries.

## Cadence

Apply the latest [editorial direction](2026-10-05-editorial-edge.md) when selecting candidates: the creator finds the current facts too lukewarm and wants more honesty and consequence. Research uncomfortable findings when warranted, retain variety, and let evidence determine the conclusion. This selection update does not authorize publication or relax the sourcing standard.

Current priority from the [October 5 launch decision](2026-10-05-launch-decision.md): prepare a strong sixth discovery before audience promotion. Five entries are approved for the public edition, and all four earlier packets received explicit keep decisions. Research can continue before independent reader testing; do not treat this as evidence that the opener or visual treatments are validated. Preserve human review for every new draft.

The Codex heartbeat `daily-weird-stats-editorial-desk` is active for 9 a.m. America/Chicago each day in this chat. It prepares work in this local repository and reports substantive new review packets or actionable corrections. It is an app automation, not a server-side Vercel cron job or a guarantee of unattended cloud availability. Check the automation card for run status if a batch is missed.

Investigate at most ten candidates per run, promote at most two drafts, and keep at most five unfinished draft/review packets. These configurable limits live in `content/editorial-settings.json`; they are ceilings, not quotas. Blocked treatment drafts and pending correction/revision packets count toward the queue. A draft and its prepared packet count once; distinct active alternatives each consume a review slot. Revised or stale packets transfer their slot to a reconciled replacement; superseded and explicitly closed correction packets retain their audit history without occupying capacity. Candidates explicitly closed, rejected or marked duplicate do not count unless an independent revision packet remains open. The same stable run ID and its consumed budget survive retries. Do not publish weak material to satisfy a quota. Build a reviewed backlog so the eventual daily publication cadence can survive research gaps. At present, public updates happen after the user approves an entry and authorizes its release; a daily draft is not a daily public update.

## Research → evidence → treatment → review → release

1. Read existing entries, the candidate report, previous research notes, and the brief. Start or resume the same run ID. Save each candidate with unchecked locators before investigating it, so the investigation slot is reserved before source work. Avoid repeating the same underlying discovery with a different number; record rejection and duplicate links instead of losing them between days.
2. Research a small varied batch. Include everyday perception, science, materials, culture, logistics, political institutions, spending, elections, and other public data where the evidence supports a clear discovery. Politics is welcome; topical outrage is not a substitute for a meaningful relationship.
3. Open primary sources. Record the exact supporting table, passage, experiment, or definition; distinguish the source's publication date, the measurement period, and today's verification date. Recalculate derived values. Note familiarity and the reason a reader might retell it. Do not invent reader validation.
4. Update the candidate using its current revision token, then promote only promising, adequately sourced work into a content record and dated review note. Pick an available reusable treatment only if it explains the idea. A custom interaction remains appropriate when the mechanism needs it; describe missing assets or code honestly. Do not force every entry into a chart card.
5. Validate and inspect the draft: `npm run check`, `npm test`, `npm run build:review`, then `npm run dev:review`. Include a concise explanation, visible qualification, sources, data table, and appropriate motion/silent fallback. Keep incomplete work in `draft`; use `review` for a complete review packet.
6. Give the user the preview and the editorial decision to make: keep, revise, or reject. Record their actual response. Do not mark a candidate approved because it passed a schema check.
7. Only after explicit approval, record `approval.by` and `approval.at`, set a timezone-bearing `publishedAt`, and change status to `published`. Build/test, review the intended release, and deploy only within the user's release authorization. Vercel deploys every push to `main` to production, so merging into `main` is the release step itself.

## Political and changing data

Use primary datasets and definitions, include the measurement period in the presentation, and identify geography and population. State whether a number refers to people, residents, citizens, registered voters, ballots, seats, dollars, or another unit. Specify denominators, nominal versus inflation-adjusted money, estimates versus final counts, and revisions where relevant. Two primary references are required across every treatment by the political evidence validator; their quality and relevance still need editorial judgment.

Separate the measured relationship from political interpretation. Do not imply causation from a trend or ratio, confuse per-capita representation with individual voting power, or cherry-pick dates/scales to produce the desired conclusion. Compare consistent definitions; explain why those places or periods were chosen. A historical snapshot is acceptable when clearly dated. Do not label it current or live.

## Charts and interaction

Bar and line renderers currently support nonnegative values with zero baselines. Every view names its unit and range; changing measures explicitly changes the labeled scale. Line x coordinates must increase and are spaced by their actual numerical distances. Always provide the underlying table and CSV. Negative values, confidence intervals, multiple series, maps, and live feeds need deliberate renderer extensions and tests before use.

For reveal entries, the question must be answered directly by the reveal. Keep the chart, numerical labels, measure controls, table, and CSV link inside the closed reveal. Do not leak the payoff through introductory copy. Give a reason to care rather than instructions to operate the chart. A familiar underlying fact needs a stronger relationship, not just a new decimal.

Use interaction to expose a relationship: toggle a denominator, compare two quantities, scrub a supported timeline, or reveal a mechanism. Keep optional guessing optional. The static reading path must make sense.

Use the version 2 reader protocols linked in the brief. Visual and plain-text checks use separate, unexposed cohorts. Repeat visitors can assess usability but cannot supply independent first-surprise evidence. Preserve historical responses verbatim and label copy versions.

## Refresh and correction lane

Run `npm run content:status`. Review entries whose `reviewDue` has passed. Do not silently replace an approved claim with newly fetched data: prepare a correction or refresh draft, show the source/date change, and request review. Immutable historical snapshots can retain their historical period; checking their source again does not make them current estimates.

Write the daily packet under `docs/editorial/batches/YYYY-MM-DD.md`. Record what was opened, verified, calculated, rejected, drafted, and still uncertain. Check for an existing packet before starting another. Preserve concurrent edits. Daily runs must not approve, commit/push, publish, deploy, change integrations, or contact other people.


## Candidate commands and resumability

Creator and agent use the same file-backed desk. `npm run content:status -- --json` includes its report; `node scripts/candidates.mjs report` exposes candidates, exact revision tokens, caps, unfinished packets and run checkpoints. Nothing in these commands approves or releases content.

```sh
node scripts/candidates.mjs run research-2026-10-05
node scripts/candidates.mjs record research-2026-10-05 /private/tmp/candidate.json
node scripts/candidates.mjs list
node scripts/candidates.mjs record research-2026-10-05 /private/tmp/candidate.json EXPECTED_REVISION
node scripts/candidates.mjs promote research-2026-10-05 discovery-id EXPECTED_REVISION
node scripts/candidates.mjs dispose discovery-id EXPECTED_REVISION rejected 'Record the actual editorial reason'
node scripts/candidates.mjs finish research-2026-10-05 /private/tmp/run-summary.json
```

The dates and IDs above illustrate syntax; no such run is claimed. Use today's local date and retain its run ID on retries. `run` resumes a partial, deferred or failed attempt without resetting investigations or promotions; completed runs remain closed. `record` without a revision only creates an ID or acknowledges the identical last input. For updates, copy the latest computed revision from the report and reconcile any human changes before retrying. A stale revision returns `conflict` and leaves the human edit intact. Command writers share a short-lived lock; a leftover lock after a crashed process requires checking that its PID is no longer running before removal. The commands cannot protect against arbitrary external file writes that disregard their locking protocol.

Candidate input requires `id`, a succinct underlying `claim`, `sources`, `evidenceGaps` and `treatmentGaps`. Each source needs an HTTPS `url`, exact `locator` such as a table/row/passage, and `status` of `unchecked`, `verified` or `unreachable`. Only record `verified` with an actual `checkedAt` date after opening the source. `entry` is the proposed ordinary content record, with the same ID and status `draft` or `review`; it may be omitted during investigation. Notes should include freshness, familiarity, a reason to retell, derivations, and remaining uncertainty. Never invent a source check or reader reaction to make a record pass.

Normalized claims and source-plus-passage locators link likely duplicates to previous candidates and their rejection reasons. Exact question/answer/title matches also link existing entries. Semantic rephrasing still needs editorial review: add `duplicates: [{type: "candidate" or "entry", id, reason}]` when the underlying discovery is already known. A `duplicate` disposition requires that earlier link. When one table supports a genuinely different discovery, `distinctFrom: [{id, reason}]` records why that source match is distinct; it does not bypass an identical claim fingerprint. Any unresolved duplicate link blocks promotion.

`promote` requires verified sources, no evidence gaps, a valid private entry, capacity, and investigation membership in the run. Treatment blockers force the promoted record to remain `draft` and consume an unfinished packet slot. Repeating the same candidate/revision promotion—even from a different run—does not create another entry. If an interruption occurs after reserving a slot, retry the same promotion; if a human edited the resulting entry, the command reports a conflict instead of overwriting it. An existing published entry needs the separate revision review flow, never candidate promotion. The manual `content:new` scaffolder respects the unfinished queue too. Both entry writers first write a complete temporary file, then atomically install it without overwriting an existing path. A write interrupted before installation leaves the reserved promotion resumable; a leftover temporary file does not count as an entry. Corrupt legacy final JSON fails closed and requires manual reconciliation, never automatic replacement.

Outcomes are structured JSON: `created` (including a saved new candidate revision), `unchanged`, `conflict`, `deferred`, or `failed`. A cap, full queue, unverified/unreachable source, or duplicate returns an explicit deferred reason. Approval and release fields, including a published status, are rejected on first writes and resume. These checks are an authoring command contract, not a security boundary against arbitrary repository edits.

A finish summary contains `outcome` (`completed`, `partial`, `deferred`, or `failed`), a truthful `note`, and optional measured `researchMinutes` and `reviewMinutes`. Summarize incomplete sources, treatment blockers and unused budget in the dated packet. A genuinely completed run may produce zero drafts; it should explain the rejections, not manufacture quota filler. Reports show recorded completed runs, but the **seven-run editorial gate remains pending** until seven real daily runs exist and the creator has assessed usable yield, measured review time and backlog age. Fixture tests are not real research runs, and caps must not increase automatically.

The daily automation keeps its existing 9 a.m. America/Chicago schedule. Its prompt should point to this workflow and the candidate report. It may save candidates, checkpoint work and prepare private drafts; it may not approve, commit, push, publish, deploy, change integrations or contact others. Public release remains a separate human-authorized action.


## Review packets and correction proposals

Use the [exact revision commands](../content-system.md#exact-revision-review-and-release) for changes to existing approved entries. Keep their working record and custom fragment intact while drafting; put replacement copy in a packet under `content/revisions/proposals/`. The packet must name the current approved baseline, and the index shows its claim/data/source differences plus form and rights gaps. Read `/review.html` locally, then follow that packet's packet-instance preview, not an arbitrary same-ID proposal. The report also links unpacketized review entries such as the Senate draft; preparing a packet makes its exact revision actionable.

Record incorporated dataset reuse and asset declarations before asking for a keep decision. Unknown rights need resolution for the affected incorporated material; they do not prevent linking a source as an ordinary citation. Original release baselines remain separate immutable snapshots. Nate approved the newer chip, mail/painting share questions, and Senate packets on October 5; those exact revisions now appear in the release manifest. Future changes need their own human decision.

Daily automated runs may prepare proposals and report readiness; they must not invoke `decide` or `release`. A passed validator, an agent's preference, and a previous release do not supply a new human response. Queue and candidate commands remain draft-only. Interrupted approval writes fail closed at build verification; follow the recovery notes in the content-system document rather than inferring an approval or overwriting a concurrent human edit.
