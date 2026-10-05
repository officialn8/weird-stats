# weird.stats — V1 brief

Created: 2026-10-04

## The promise

A beautiful place to discover numbers that make the world feel stranger, funnier, and more interesting. A visitor should understand one discovery quickly, enjoy how it is presented, and choose to explore another.

Working description: **A collection of wonderfully unnecessary discoveries.** This is draft positioning, not a settled tagline.

This brief incorporates the October 4 conversation and narrows the [original ideation](ideation/2026-10-04-weird-stats-site-ideation.html). It defines the first experience; it is not a software implementation plan. The [first editorial selection](editorial/first-selection.md) preserves the initial research. The later [editorial reset](editorial/2026-10-04-editorial-reset.md) supplies the current candidates for testing.

## Decisions carried forward

- Cover unrelated subjects. The collection should feel expansive and unpredictable.
- Give visual beauty and content equal attention. The site should be enjoyable before, during, and after an interaction.
- Preserve anticipation and reveal. Guessing is an invitation on selected entries, with an equally clear “Show me” option.
- Mix questions with immediately visible discoveries. Visitors can browse without taking a quiz.
- Keep the tone warm, curious, and occasionally funny. Cuteness should emerge through objects, illustration, and small responses.
- Make the main discovery easy to understand and the evidence easy to inspect.
- Make the primary experience a continuous scrolling collection, with an orange identity and fluid, purposeful motion. Do not make a topic picker the entrance to the experience.

## The first visit

1. **Arrive at a curiosity.** A featured question, an expressive visual, and a visible action occupy the opening screen. A brief description establishes the site. The collection begins within easy scrolling distance.
2. **Reveal it.** One tap gives the answer. An optional choice or guess can precede the same reveal. Choosing records the guess without revealing; the separate reveal action works with or without a guess. There is no score, timer, or penalty.
3. **Understand it.** A prominent number and a short explanation make the discovery clear. Any qualification needed to keep the claim true appears here. Sources and calculations expand below.
4. **Keep wandering.** Scrolling brings the next discovery into view. Optional related links offer a second route. Back returns to the previous place and state.
5. **Browse or share.** A collection view exposes the range of entries. Each stat has a direct link; someone arriving through it can discover the rest of the site.

## Ongoing publication direction

The October 4 follow-up establishes the hosted page as a starting point, not a finished four-fact product. Build a modular, continuously growing collection with daily researched drafts for the creator’s review. Political institutions, public datasets, real charts, and other serious subjects belong alongside surprising everyday discoveries. Maintain varied, purposeful interactivity and the approved orange scrolling direction as content grows.

The current implementation separates records from reusable reveal/bar/line treatments and the four bespoke experiences. Drafts cannot enter the normal build before an approval record and publication date are supplied. The daily editorial automation prepares review packets at 9 a.m. Central; it does not automatically publish. See [daily workflow](editorial/daily-workflow.md) and [content architecture](content-system.md).

## Prototype and first release

**Prototype:** work toward six finished entries, one coherent visual direction, mobile and desktop layouts, a scrolling collection, source details, and direct links. The current four-entry visual prototype covers chips, copper, mule mail, and the painting. Its content lineup is provisional. Following the creator’s completed text check and explicit authorization, WS-15 (chips) received a complete visual treatment before independent responses were collected. Chips lead this test; that placement is not validated. Other editorial candidates still need screening. No opening entry is settled.

**Study-plan history:** the earlier walkthrough recommended painting, mule mail, and the seal spiral. The creator then explicitly requested painting, mule route, and copper comparison; that became the implemented set. The seal spiral remains unbuilt and untested. The [prototype notes](prototypes/visual-studies/README.md) record the change and the later interaction review.

**Initial public release:** expand toward 30–50 entries only after the six demonstrate sufficient variety and quality. This is a working scope, not a quota. Start with hand-selected content and a small set of reusable visual treatments. Reserve a little room for special compositions.

| Include in V1 | Revisit after the core experience works |
| --- | --- |
| Tap-to-reveal and optional choices | Daily games, streaks, and crowd comparisons |
| A few purposeful interactive visuals | Personalization and deeper simulations |
| Browsing, direct links, and curated next steps | A zoomable number-line view |
| Sources, dates, assumptions, corrections, and daily assisted research | Automatic publication and a full editorial CMS |
| Share previews for individual entries | Accounts, collections, and community features |

Content is prepared ahead of visits and generated at build time. Dated public-data snapshots and review reminders come first; a live data feed needs its own sourcing, revision, reliability, and chart design work. The current native site does not need a framework migration to add new records.

## Editorial standard

An entry earns its place when its question is understandable, its answer changes an expectation, and its visual helps the discovery land. Original calculations are welcome when their inputs and assumptions are visible. Familiarity is a selection criterion before visual design begins: a beautiful treatment cannot make a known answer into a new discovery.

An unfamiliar answer also needs a reason to care. For the next selection, favor recognizable objects with an unexpected mechanism or consequence that readers can retell in one sentence. Everyday relevance is the current research direction, not a requirement that every future entry be useful. Ask who they would tell and what they would say; a polite “yes” alone is weak evidence.

**Recognize the underlying fact, not just the exact number.** Someone who knows wombats make cubes has already encountered that discovery even if they cannot recall the daily count. More precise wording, a new illustration, or an added decimal does not qualify as fresh material. The cloud, wombat, Venus, and shuffle entries are parked outside the prototype. They may be useful as visual exercises, but they cannot establish that the site delivers new discoveries.

Research outward from original studies, institutional records, object specifications, and unusual local practices. Use general trivia lists to detect repetition, not to fill the collection. Look for an accessible subject with an unfamiliar relationship or mechanism. Obscurity alone is insufficient: a reader must still understand why the answer is worth knowing.

Every entry needs a headline or question, reveal, short explanation, value and unit, scope, evidence type, source link, checked date, essential qualification, visual idea, and related-entry rationale. Distinguish measurements, estimates, reported specifications, calculations, and hypothetical models.

Reject misleading comparisons, precision the source cannot support, and headlines whose surprise disappears when the missing context is restored. Automated candidates still need human editorial judgment. Select the sequence for variety of subject, scale, emotional tone, and interaction.

## Visual direction to test

Current direction: an orange-led, continuous scrolling collection with oversized expressive numerals, physical objects, contrasting backgrounds, and fluid transitions. The creator preferred the later scrolling design to the earlier tabbed studies. Preserve that progress while testing stronger discoveries. Vary composition and pacing to give the next entry a reason to catch the eye.

Keep navigation and reading conventions consistent while varying the central composition. Avoid making every entry a chart inside the same rounded card. Motion should explain a change or reward an action, then settle. The static state must remain beautiful and legible.

Buttons must work with touch and keyboard. Reveals must be readable by assistive technology. Provide a reduced-motion presentation, preserve ordinary scrolling, and avoid sound or movement that starts unexpectedly. Numerical labels and units must remain readable on a small screen. Illustrative exaggeration must be labeled where it could be mistaken for scale.

## How to judge the prototype

Use two separate groups of fresh readers. Run the current visual check first with people who have not seen the chip answer or text protocol. Observe revealing, sound use, sources, and voluntary continuation without instruction; then ask about comprehension, familiarity, retelling, recall, and visual enjoyment separately.

Use a different group for the version 2 plain-text check. Show its fixed questions and reveals, rotate order, and record whether the underlying idea is familiar, changes expectations, or earns a specific retelling. Recognition and interest are separate: a fact can be unfamiliar and still uninteresting.

Do not put the same participant through text then visuals and count both as first impressions. If recruitment is limited, prioritize the visual check; any later session with that reader is explicitly a follow-up usability check, excluded from fresh-reader novelty and surprise evidence. Record prior exposure and exact responses rather than presenting a small sample as a population estimate.

Advance when the experience is clear, several entries produce a memorable discovery, and visitors choose to keep exploring. A tiny qualitative review cannot establish broad retention or demand. Revise weak content and confusing interactions before multiplying the collection.

## Next work

**October 5 update:** the creator's [launch decision](editorial/2026-10-05-launch-decision.md) now sets the immediate order: deploy the five approved entries, prepare a strong sixth, verify cookieless measurement, then consider audience promotion. The protocols below remain available for private feedback, but recruitment is not a prerequisite to preparing that sixth entry. No independent reader evidence is implied by release approval.

Daily publication preparation now proceeds alongside reader checks: review the political comparison draft, build a quality backlog, and expand treatment types when the discovery needs them. These are the immediate operational priorities. The earlier reader checks below remain useful evidence tasks, not a claim that development is complete.

1. Run the [version 2 chip visual check](editorial/2026-10-04-chip-visual-check.md) with fresh readers who have not seen any chip answer. Observe the optional sound impression and direct reveal separately. The creator’s version 1 walkthrough remains historical evidence, not a blind response to this revision.
2. With a **different, unexposed group**, run the [version 2 text check](editorial/2026-10-04-second-reader-check.md) for the four candidates and copper baseline. Do not recruit visual-check participants into the fresh text cohort. Keep copy fixed, rotate order, and capture actual retellings.
3. Compare the two groups descriptively, without attributing differences to visuals in this tiny qualitative sample. Choose the opener after evidence of comprehension, novelty, interest, and voluntary continuation. If fresh readers are scarce, do step 1 only; later repeat exposure can test usability, not novelty.

**Reader-check status, October 4:** the [first creator walkthrough](editorial/2026-10-04-reader-walkthrough.md) is complete, and the copper, mule, and painting studies were built afterward. The creator had seen the answers before the walkthrough. Later, he relayed his girlfriend's whole-site feedback about familiarity, relevance, and blandness; that was not a controlled per-entry test. Independent checks of the new candidates remain open.
