# Home-page preview card, version 1

Human direction: Nate's October 5, 2026 message in the project chat, replying to the card review packet that showed the image at full size, as a 300 px thumbnail and as a square crop, with the exact strings below.

> looks good, approved

- **By:** Nate
- **At:** 2026-10-05T14:08:38-05:00
- **Input reference:** project chat, reply to the version 1 review packet
- **Scope:** the collection (home page) link preview only. This approves the strings and image below for `https://weirdstats.dev/`. It does not authorize a release, audience promotion, or any change to discovery content or share copy.

## Approved strings

| Field | Text |
| --- | --- |
| Link title (`og:title`) | weird.stats: wonderfully unnecessary discoveries |
| Description (`og:description`) | Unexpected discoveries, interactive comparisons, and sourced numbers about the world. A collection for the incurably curious. |
| Image headline | Wonderfully unnecessary discoveries. |
| Image sub-line | A collection for the incurably curious. |
| Image footer | Open the collection. ↗ |
| Alt text (`og:image:alt`, `twitter:image:alt`) | weird.stats: Wonderfully unnecessary discoveries. A collection for the incurably curious. |

The description is the site's existing meta description, unchanged. The tab title stays "weird.stats | Wonderfully unnecessary".

## Approved image

- **Path:** `social/home-v1.png`, 1200 × 630, rendered at build time by `renderCollectionShareImage()` in `scripts/share-images.mjs` from `scripts/collection-copy.mjs` version 1.
- **SHA-256:** `127c519365b41381d2a883c108d5008c6c5c19f818657d9f77ef1df7dd5085f8`
- **Art:** three fanned ink cards with a paper-colored "?" on the front card; original vector artwork with no discovery's question, answer or imagery.

The square crop cuts off the headline and wordmark, as the discovery cards' layout does; this was shown and accepted. The "wonderfully unnecessary" tagline remains provisional positioning in `docs/v1-brief.md`; this approval covers its use on the card.

## Changing the card

Any change to these strings or the art is a new version: a new `version` in `scripts/collection-copy.mjs`, which publishes under a new filename, plus a new approval record with the exact strings and the new image's SHA-256. A test pins the approved hash, so an unapproved change to the rendered card fails CI. Crawlers cache previews by URL and cannot be recalled, so a published version is never overwritten. The build emits only the current version, so after a version change an older shared link loses its image if a platform re-fetches it; keep emitting the previous approved file at that point if old shares matter.
