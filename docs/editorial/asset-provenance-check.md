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
