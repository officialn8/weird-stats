# Release now, test the product at six discoveries

Human direction: Nate's October 5, 2026 message in the project chat, headed “A plan that works whether the idea takes off or not.”

> Approve the four proposals and deploy, so the public sees the new chip, the copper, the painting zoom and eventually the Senate chairs.

This explicitly authorizes approval and deployment. It does not authorize audience promotion yet, automated future approvals, or granting Vercel GitHub repository access.

## Exact decisions

All four pending packets were conflict-free and had no release-readiness gaps when approved. Each decision is stored in `content/revisions/decisions/` with this input reference. The manifest selects these revisions alongside the already-approved copper revision:

| Discovery | Approved content digest |
| --- | --- |
| crunch | `4d03cf959695708297988c41a83f22d491ae51dde62eb0361483b423806eefde` |
| copper (existing approval) | `c30200e2edcd9244d8d3165ba29c53841f7516ca5247400f0a2d232fcf8e74e5` |
| mail | `24caf22f4be1773d2fb2d773aeaef407740ae5a89e25488e48c628aee2ede421` |
| painting | `55d41d5e10934ffd434e3e054746451a950792f2d3fda9530f469a0addc196aa` |
| same-two-seats | `af60e186be0cac71a5acf5a2ceab828c0cef027708dcafbb74fc5150b90f50d0` |

The Senate packet ID is `149afad07b37016b0c2bb0cfa48e9126bb1504d3ed6fbfe994d7c243f7163395`; the other packet IDs equal their content digests. Copper had no pending proposal. The Senate is the fourth proposal and becomes the fifth public entry under this approval.

## Work before promotion

1. Verify and deploy these five complete entries, their individual pages, and their question-only share images.
2. Prepare one more strong discovery for Nate's review. Start from the existing candidate research and favor an everyday mechanism with a surprising consequence and a visual that earns its place. Six is a quality target, not a quota. Do not pad the collection with a familiar fact.
3. Keep daily research and human approval. No automatic publishing. New reusable forms and a daily edition remain separate decisions; reaching six does not require either.
4. Add minimal cookieless PostHog events and verify that they actually arrive before collecting launch evidence.
5. Check the complete six-entry experience on mobile, keyboard, and reduced motion. Confirm every share link, preview, and source. Only then ask for the separate instruction to promote it.

Hacker News and r/InternetIsBeautiful are possible promotion destinations supplied by Nate, not scheduled posts or promised sources of visitors. Nothing is to be posted or sent now.

This changes the immediate order in the broader roadmap: finish about six strong entries before recruiting an audience. The earlier small-reader protocol remains useful if Nate wants private usability feedback; it is not a prerequisite to preparing the sixth entry. No independent reader evidence has been collected, and the opener and treatments are not proven.

## Launch decision rule — chosen before seeing results

Use the first seven complete days after an explicitly authorized audience launch. If fewer than 300 eligible collection visits arrive, allow up to 14 days. Fewer than 300 at that point is **inconclusive reach**, not proof that the experience failed. The clock has not started with this quiet deployment.

An eligible collection visit is a measured page visit to `/`, in a visible browser tab, with at least two revealable discoveries available. Exclude marked QA traffic, localhost, preview/review builds, recognized automation, and pre-launch events. Count a reload as a new visit; cookieless page-memory measurement does not establish unique people or returning-user retention. Blockers and privacy opt-outs cause undercounting.

**Main threshold: at least 30% of eligible visits reveal two distinct discoveries.** Repeating or resetting the same reveal does not count twice. This is a working product decision threshold, not an industry benchmark or a claim of statistical certainty.

- At or above 30%, keep investing for a bounded next cycle: improve the weakest discovery and add a few strong entries, then check again.
- Below 30% with at least 300 eligible visits, stop expanding the content library. Inspect reveal and continuation drop-offs, make one focused revision, and run one comparable round with new traffic. If that also misses the threshold, archive active growth and retain the site as a polished portfolio project with a written lesson.
- Broken instrumentation, major usability bugs, or a radically different source mix make a round inconclusive; fix the problem and document a new window rather than quietly changing the threshold.

Supporting signals: the proportion seeing another discovery after a reveal, which entries are revealed, and share intent / completed browser action. A copied link or resolved native share is not evidence that someone received or opened it. Read these alongside voluntary written feedback; they do not prove novelty, comprehension, or virality.

Individual-entry visits are a separate cohort. Report their reveal and onward-click rates separately from the collection threshold: they initially offer only one discovery. Do not combine these denominators.
