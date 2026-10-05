# Existing asset provenance check

Checked October 4, 2026 for the approval migration. These are source declarations and local provenance records, not a legal guarantee or a new content approval. `git diff 0edaeec -- public/assets` was empty during this check.

| Local assets | Declaration / supporting record |
| --- | --- |
| `penny.webp` | The [Commons source page](https://commons.wikimedia.org/wiki/File:US_One_Cent_Obv.png) identifies a U.S. Treasury image and declares it public domain in the United States. |
| `nickel.webp` | The [Commons source page](https://commons.wikimedia.org/wiki/File:US_Nickel_2013_Rev.png) identifies the U.S. Mint as author and declares the Treasury image public domain in the United States. |
| `nightwatch.webp` | The [Commons source page](https://commons.wikimedia.org/wiki/File:The_Nightwatch_by_Rembrandt_-_Rijksmuseum.jpg) identifies a faithful reproduction of public-domain art, with a Public Domain Mark. It notes jurisdictional differences for photographic reproductions. |
| `chip-a.mp3`, `chip-b.mp3` | [BigSoundBank #1430](https://bigsoundbank.com/eating-potato-chips-1-s1430.html) declares CC0 and identifies Joseph Sardin as author. The existing [audio provenance record](../prototypes/visual-studies/assets/chip-audio.md) documents both edits. |
| `outfit.ttf` | The bundled `public/assets/OFL-Outfit.txt` declares SIL Open Font License 1.1, copyright 2021 The Outfit Project Authors. Keep that license in build output. |
| `chip.webp`, `chip-small.webp` | The existing [provenance record](../prototypes/visual-studies/assets/chip-audio.md) identifies generated decorative illustrations and the retained original. They are not study photographs. |
| `mule.webp` | The existing hosted footer and prototype identify a generated illustration. Preserve that declaration; do not relabel it documentary photography or claim a third-party stock license. |

New incorporated assets and reused datasets need their own declared basis, source, attribution and file identity before release. An ordinary outbound research citation does not itself incorporate the linked paper or dataset into the site.

For the private Senate comparison, the Census Bureau's [public-use and citation statement](https://www.census.gov/about/policies/citation.html), checked the same day, explicitly addresses reuse and replication. It asks users producing their own estimates to credit Census for the original data and makes their analysis their own responsibility. Retain the exact Table E reference and identify the 21-state sum as this project's calculation. This source declaration does not approve the draft or independently verify its arithmetic.


## Static share-card font, October 5, 2026

`public/assets/outfit-bold.ttf` is the official static Bold face from [Outfitio/Outfit-Fonts, commit 9027738](https://github.com/Outfitio/Outfit-Fonts/blob/902773808eb372f70fb34e8946dd1ffe604efc79/fonts/ttf/Outfit-Bold.ttf). Its SFNT tables have no variable-font axis table and OS/2 weight is 700. SHA-256: `f620b69582e06d7e1b3bbde74ed8c5876eadabb038390780db2a3414a1490197`. The source repository's OFL notice matches the existing license and author declaration. This build-only font renders the share PNGs; it does not replace the website's variable font or wordmark.

Share cards reuse each selected scene's existing image bytes, converted to PNG at build time by Sharp. Their ownership and approved source-byte hashes remain checked before output. No remote image/font requests are made during a build.

## Collection preview card, October 5, 2026

`social/home-v1.png`, the home-page link preview, is rendered at build time from original vector artwork drawn in `scripts/share-images.mjs`: three fanned card shapes and a "?" in the bundled static Outfit Bold face. It incorporates no photograph, illustration, entry asset or third-party artwork. Nate approved version 1 on October 5 ([approval record](2026-10-05-home-preview-approval.md)); SHA-256 `127c519365b41381d2a883c108d5008c6c5c19f818657d9f77ef1df7dd5085f8`.

