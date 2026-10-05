# Roadmap implementation evidence

**October 5 release update:** Nate approved all four pending proposals, and the five-entry edition is now public. All 76 tests pass. The [launch decision](2026-10-05-launch-decision.md) supersedes the immediate recruitment order: prepare about six strong entries before audience promotion. [Hosting](../hosting.md) records the actual deployment and checks. Cookieless PostHog is now active in the separately authorized weird.stats project; [production QA and the saved engagement readout](../launch-analytics.md) verify ingestion. Audience promotion and the fixed launch evaluation window have not begun. The entries below preserve the history of earlier implementation checkpoints.

Local implementation began October 4, 2026, from `94f2c0d` on `fix/editorial-reveal-review`, using the [product roadmap](../plans/2026-10-04-2200-feat-discovery-product-roadmap-plan.md). This is an execution record, not a claim that the whole roadmap or its audience gates are complete.

## Implemented checkpoints

- U1: treatment registry, entry-scoped reveal lifecycle, selected asset ownership, and minimal revision/release contracts. Authoritative checks and 21 tests passed at integration.
- U2: paired population/seat comparison, optional guess, direct reveal, accessible static explanation and encounter-triggered replay. A fictional orchard comparison exercises the same form. The Senate example remains private. U2/U6 integration passed 35 tests.
- U3: individual discovery routes, question-led PNG previews, canonical links, share/copy fallback, withdrawal notices and a real 404 artifact. Integration passed 43 tests, both builds and anchor/asset checks. A subsequent copper no-script fallback has a focused regression test with an observed red/green result.
- U4 preparation: [moderator protocol](visual-forms-reader-check.md) and [blank response sheet](reader-results/round-1-template.md). No independent reader sessions have occurred.
- U6: candidate ledger, optimistic revisions, duplicate/rejection history, bounded resumable investigations, draft promotion and queue limits. The existing 9 a.m. America/Chicago heartbeat was updated to use these commands while retaining its prohibition on approval, commits, pushes and deployments. Zero real research runs have been completed by this implementation task.

- U7: exact-revision private previews and diffs, human-input decisions, separate release selection, rights declarations, and migration from the verified original deployment. Three later changes remain private proposals. Full integration passed 57 tests and both builds. The shared queue counts four of five unfinished slots, including correction proposals.

U5 and U8 remain intentionally unimplemented because their reader-evidence dependencies have not passed. Code review completed with eight validated findings; the follow-up record below tracks their resolution.

## Simplification pass

Three read-only reviewers examined reuse, quality and efficiency. Applied two shared-I/O improvements, removed one unused constant and eliminated repeated coordinate generation in the line renderer. Serialization remains at the same point in the atomic-write sequence, retaining cleanup/error ordering. A fictional line render matched its pre-change HTML byte for byte. No safety checks or approval boundaries were removed. One duplicate suggestion was merged; no distinct worthwhile finding was skipped. Syntax/content checks and all 57 tests passed afterward. The project has no separate typechecker or formatter/linter command.

## Browser observations

- The Senate reveal acknowledges an optional guess and presents resident populations and allocated seats together, without a measure toggle.
- Desktop and 320-pixel mobile layouts were inspected; the mobile body did not overflow horizontally. At 390 pixels, the individual route also fit, and native keyboard activation revealed the comparison.
- The chip individual route loaded its imagery and revealed without playing audio automatically. Browser warning/error capture was empty during these checks.
- A generated 1200 by 630 orange share image was visually inspected. This does not establish what an anonymous social crawler receives from Vercel.
- Disabled-JavaScript and operating-system reduced-motion settings were not emulated in the browser. Focused tests cover native disclosures, static rendering, motion lifecycle and the no-script copper styles; those tests are not a substitute for that browser coverage.

## Remaining evidence and decisions

1. Recruit three to five unexposed readers and run the prepared visual protocol. Apply its novelty, comprehension and continuation gate independently to each form before expanding it.
2. Observe seven actual research runs before changing drafting limits. Test data and this implementation session do not count.
3. After the dependent units are ready, decide whether the homepage opens on the continuous collection or the latest Spread, and rehearse seven dated Spreads with at least one first-publication discovery each. Do not claim a fresh daily reader edition before that gate.
4. Review editorial proposals and explicitly authorize any release. Individual pages and PNGs are local release candidates; no deployment was performed in this task.
5. On an authorized deployment, test anonymous page/image access and an actual social preview. The existing production homepage is public (verified anonymously October 5). New route/image access and social previews still need checks on the actual deployment; local/CLI inspection is insufficient.

The migrated mail and painting share titles retain their old released headings; those are not the intended question-led previews. The private proposals show the new questions. Their review and separate release authorization remain blockers for publicly rolling out the new share surfaces. Restoring the verified baseline is not approval of those older hooks as the final design.

## Code review and follow-up

Actual `ce-code-review mode:agent` completed against `94f2c0d`, including staged simplification and documentation. Receipt: `/tmp/compound-engineering-501/ce-code-review/20261004-234333-4b9b51aa/review.json`; run `20261004-234333-4b9b51aa`, status `complete`. Eleven local lenses and an independent validator retained eight findings. The initial verdict was not ready. No external-model review ran: automatic approval review rejected transmitting private project material to Anthropic, and the documented local adversarial fallback was used without retrying the rejected transmission.

The fixes are grouped by shared edit surface: revision lifecycle, release transitions and exclusive candidate creation (#1, #3–#7, which share the queue and review files); runtime factual inputs (#2); and reduced-motion replay (#8). No finding is dismissed or silently deferred. Final results are recorded after integration.

All eight findings were applied and verified. Review instances now preserve decisions across resubmission, supersession and closure; approved snapshots retain original provenance; releases preserve old routes or explicit withdrawal notices; entry creation installs complete JSON without overwriting another writer; PNG/CSV isolation is tested; runtime facts come from approved markup; and Replay follows both motion settings. No justified code-review finding remains unresolved.

Final integration on October 5 passed `npm run check`, all 67 tests, `npm run build`, `npm run build:review`, and `git diff --check`. A final test run left the timestamps and sizes of all 64 generated files unchanged. The public build contains four pinned discoveries; the private build contains five. The Senate draft now has an exact private packet, so the queue contains four pending proposals, zero unpacketized drafts and four of five occupied slots. No human approval or release decision was invented. No push or deployment occurred.

Final browser checks confirmed the paired reveal and Motion off disabling Replay, a 390-pixel layout with no horizontal overflow, the mail's derived 3h/5h/8h narration and eight marks, and copper's approved answer with 60 generated pennies. Browser warnings/errors were empty. A screenshot is saved locally at `artifacts/preview-paired-comparison.jpg` (ignored by Git). Native sharing stayed pending in the in-app browser during an earlier check, so actual native sharing remains unverified despite passing fallback tests. OS reduced-motion emulation, JavaScript-disabled browser reading and new hosted-route/social checks remain explicit coverage limits. The existing production homepage was subsequently verified as anonymously accessible on October 5.

## Requirement status

| Requirement | Current result |
|---|---|
| R1–R2 | Orange scrolling collection retained; optional guesses and closed native reveals; individual question previews generated. Existing released hooks remain subject to the pending editorial proposals. |
| R3 | Paired comparison implemented and exercised with fictional second data. Three expressive forms and two real reviewed examples per form remain gated on U4/U5. |
| R4 | Encounter-driven lifecycle, pause/finish behavior and static reading implemented. OS reduced-motion and JavaScript-disabled browser coverage remain unverified. |
| R5 | Protocol and blank evidence sheet prepared; zero independent sessions. |
| R6 | Local discovery pages, canonical links and PNGs implemented. Hosted anonymous access, actual social preview and question-copy approval remain release gates. |
| R7 | Stable discovery routes and withdrawal notices implemented; bounded collection and legacy-hash archive routing belong to gated U8. |
| R8, R10 | Public selection uses explicit approved revision pins; exact private packets and separate human release decisions implemented. |
| R9, R12 | Bounded candidate desk, resume/conflict handling and reports implemented. Existing automation updated; seven real runs still required. |
| R11 | Dated reader Spread and cadence rehearsal remain gated U8 work. |
| R13 | Cross-treatment political requirements and declared reuse provenance checks implemented; validators do not establish truth or legal rights. |

## Release validation handoff

For the next authorized preview, the implementer should verify every pinned discovery route, image and export, plus a never-public ID and a withdrawal. Confirm the public build contains no review index, draft data or private media. Exercise reveal, silent reading, reduced motion, mobile layout and onward navigation on the deployed origin. Record the deployment ID alongside the manifest revision.

During that preview session, a draft leak, wrong pinned copy, missing preview image, broken reveal or failed source link is a release blocker. Preserve the previous release and correct the candidate before promotion. If an authorized release regresses, restore the preceding complete release artifact, including HTML, metadata, images and data exports. The creator owns release authorization; the implementer owns these checks. No unattended production monitoring or unverified analytics baseline is claimed.

See [the pre-deploy follow-up](2026-10-05-pre-deploy-review.md) for the corrected access status, share-card redesign, consistent guesses and simpler review surface.
