> Archived prototype: the maintained site now lives in the repository’s `public/` directory. Run `npm run dev` from the repository root. This folder preserves the visual-study history.

# Scrolling discoveries

Updated October 4, 2026 with the chip sound-comparison study following the design review. Native HTML/CSS/JavaScript; no build step or runtime network dependency.

Preview: http://localhost:63013/index.html. To run from this directory: `python3 -m http.server 63013 --bind 127.0.0.1`.

## What this prototype tests

A continuous orange scrolling page with chips, copper, mule mail, and painting scale. There is no topic picker. The creator preferred this direction to the earlier tabbed design, while later feedback still found the content and presentation short of the intended impact.

The first walkthrough's recommendation was painting, mule mail, and the seal sleep spiral. The creator subsequently explicitly requested visual treatments of **painting, mule route, and copper comparison**. That request superseded the recommendation. Copper became the implemented opener; the seal spiral was never built or visually tested. This prototype cannot answer whether the seal would make a strong opener. The old README and design notes failed to record that change.

The [current brief](../../v1-brief.md) and [editorial reset](../../editorial/2026-10-04-editorial-reset.md) keep the eventual lineup open. After the creator’s text check favored chips, the creator authorized a complete chip visual entry. Chips now open this visual test; copper, mule mail, and painting follow. This advances a visual experiment before independent-reader evidence has been collected. It does not validate the opening choice. Printers remain an editorial candidate.

## Interactions

- Chips offer optional A/B playback of the same real crunch recording with different frequency filtering. Audio loads only on a Listen click; no autoplay. A browser analyser drives the chip and waveform while playing. Volume, mute, stop/replay, offscreen stop, and background-tab stop are provided. Motion-off preserves audio and the entire explanation.
- The chip reveal also works without listening. It qualifies the 15-of-20 response as informal questioning after one small 2004 experiment. Listening to our clips does not reproduce biting with altered feedback. Keyboard focus moves to the result; reset restores focus to the reveal control.

- Copper asks a straight question. Click either coin or “Show me” to reveal; scrolling never reveals the answer. A guess receives a short acknowledgment, with no scoring. Reset returns focus to the triggering control. The comparison labels prominently identify copper mass, not currency value. Exactly sixty penny images appear.
- Mail retains the three-hour descent and five-hour return, with eight equal hour marks. Playback starts when visible and can replay. The bridge now says “the mail has legs.”
- Painting leads with **0.005 mm per pixel**. In supporting browsers, a sticky, scroll-driven sequence moves from the painting overview to an enlarged 1 mm × 1 mm diagram containing 200 × 200 pixels, then magnifies the grid to highlight one pixel. The 717-billion-pixel and 8,439-photo totals follow the sequence.
- Painting controls offer direct access to the three scales. Motion-off, OS reduced motion, short viewports, and browsers without CSS view timelines show three ordinary static panels with all information available. No scroll events or wheel interception are used.
- System, light, and dark appearance remain available. Sources use native disclosures.

## Evidence and illustration limits

The coin comparison uses rounded U.S. Mint specifications. The mail timing follows USPS's reported route and uses accelerated playback. The painting journey transitions explicitly to a mathematical diagram: it does not show an actual millimeter crop of the museum scan. The overview is a lower-resolution reproduction; diagram colors are illustrative. A true photographic deep zoom would require appropriately licensed high-resolution tiles and their spatial calibration. No synthetic paint texture is presented as measured evidence.

## Assets and history

- `assets/penny.webp` and `assets/nickel.webp`: public-domain U.S. Mint images via [penny](https://commons.wikimedia.org/wiki/File:US_One_Cent_Obv.png) and [nickel](https://commons.wikimedia.org/wiki/File:US_Nickel_2013_Rev.png) on Wikimedia Commons.
- `assets/chip.webp`, `assets/chip-small.webp`, `assets/chip-a.mp3`, and `assets/chip-b.mp3`: generated illustration and edited CC0 audio. See [asset provenance](assets/chip-audio.md).
- `assets/mule.webp`: the earlier generated mule illustration.
- `assets/nightwatch.webp`: public-domain [overview reproduction](https://commons.wikimedia.org/wiki/File:The_Nightwatch_by_Rembrandt_-_Rijksmuseum.jpg).
- `assets/outfit.ttf`: Outfit, with SIL Open Font License in `assets/OFL-Outfit.txt`.
- `revision-tabs/` preserves the previous tabbed HTML/CSS/JS; restore alongside the parent assets to run. `before/` holds the initial study. The generated canyon is unused.

## Verification

See [verification-crunch.md](verification-crunch.md) for this revision’s checks and [the fresh-reader protocol](../../editorial/2026-10-04-chip-visual-check.md) for the next reader session. [verification-review.md](verification-review.md) records the prior interaction review. Older Lighthouse reports and preview images describe their named historical revisions, not this implementation. Browser checks establish functionality, not a jaw-dropping experience or reader demand.
