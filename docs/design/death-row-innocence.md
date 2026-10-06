# Death-sentence innocence: local design record

Recorded October 6, 2026 from the current private implementation. This is an ordinary extension of weird.stats, not a global design system or approval to publish. The scoped contract is [the death-sentence surface brief](../../.impeccable/surfaces/src-exhibits-death-row-innocence-html.md). `PRODUCT.md` and the incumbent styles remain authoritative; the pre-existing absence of root `DESIGN.md` is left as a documentation gap.

## Overview

The orange opening gives the historical estimate first, with scope and qualification beside it. A native disclosure opens its uncertainty. A dark graphic then makes the consequence tangible: a close view of one imagined prison cell precedes an overview of 1,000 cells. The quieter evidence passage follows on the inherited page ground. This replaces the earlier abstract standing-marker field; it is original schematic geometry, not a reconstruction of a prison or a depiction of identifiable people.

The 4.1% estimate, 2.8–5.2% interval, explanatory text and linked sources all describe Gross et al.'s 2014 study of U.S. defendants sentenced to death in 1973–2004. They do not describe today's death row or count innocent people executed. The multiple source links are access points to the same study. This document records the implementation's framing; it does not claim a new source verification or human editorial decision.

## Colors

The scoped orange (`#ff681f`) and brown (`#291b10`) match the incumbent light-theme accent pair in `public/styles.css`. The graphic reverses the incumbent ink/paper pair: ground `#29211b`, text `#fff8f0`. Its supporting copy is `#e8c9b4`; selected controls use `#fff8e8`, with the existing dark-theme orange (`#ff803b`) on the active view underline and range input. These are local uses, not new global tokens.

The Three.js scene uses concrete `#6c645b`, iron `#534e47`, cloth `#a69a80` and anonymous figure material `#decbb0`, with warm lights. Overview instances receive pale `#fff4ce` or muted `#584330` tint across their parts. Pale floors make the proportion especially visible. An unlit cell does not establish guilt.

## Typography

The scene inherits the bundled Outfit family (`Outfit, Arial, sans-serif`) and the incumbent expressive number hierarchy. Its opening heading uses `clamp(52px, 7.2vw, 96px)`, weight 550, line-height 1.04; the finding uses `clamp(160px, 25vw, 350px)`, weight 550, line-height .85. The claim uses `clamp(27px, 3vw, 46px)`, weight 500, line-height 1.1. These echo the collection's oversized numerals without forcing every discovery into one composition.

Graphic headings use `clamp(36px, 4vw, 58px)`; its ratio count is 68px, weight 500, and 54px below 700px. Evidence copy runs 17–19px on desktop; qualifications and graphic captions run 14–16px. Mobile overrides are kept local, including the 29px claim and `clamp(148px, 42vw, 245px)` finding below 600px.

## Layout

The opening and evidence inherit the collection's 1500px maximum width and 5vw gutters, with 22px gutters on small screens. The finding pairs number and interpretation horizontally, then stacks below 600px. The evidence passage similarly shifts from two columns to a single reading order. The graphic uses a full-width dark passage, not a rounded chart card, and stacks its heading and controls below 700px.

The effective 3D field height is `clamp(430px, 48vw, 650px)`, switching to 340px below 700px. An orthographic camera fits both the close cell and all cells to the field's aspect ratio. The 1,000 positions form a fixed 40-by-25 schematic arrangement, spaced 4.3 by 5.3 scene units; these dimensions have no claim to real facility dimensions or geography.

## Elevation & Depth

The reading surfaces stay flat, with rules and tonal changes establishing sections. Actual 3D boxes and a low-resolution sphere form walls, bed, seated figure and barred door. Warm hemisphere and directional light, rough materials and a shadow-receiving ground make the close cell legible. Depth is confined to this explanatory scene; it does not establish a new global shadow convention.

## Shapes

The scene is an open-roof schematic with two concrete walls and a closed front grille. The bed and seated anonymous figure supply human scale. There are no imported models, generated image plates, photos or named people. Native estimate buttons use 4px corners; view buttons are flat text with an active underline. These controls extend the incumbent native disclosure, text-button and visible-focus conventions.

## Components

- **Evidence disclosures:** native `details`/`summary` retain keyboard operation and no-JavaScript reading. The confidence interval remains on a labeled 0–6% axis, accompanied by its textual interpretation, table and CSV.
- **Scene views:** “Inside one cell” is the default; “See all 1,000” switches immediately to the overview. Native buttons expose `aria-pressed`. The door never opens and the person never escapes.
- **Estimate choices:** 2.8%, 4.1% and 5.2% produce exactly 28, 41 and 52 highlights out of 1,000 (`percent × 1,000 / 100`). A fixed seeded ranking gives nested highlight sets without relocating cells. Selecting a rate switches to the overview and updates visible count, label and status announcement.
- **Turn control:** a native range input runs from −25 to +25 with keyboard support and descriptive value text. It rotates the camera relative to the default angle; it does not change the population or estimate.
- **Static reading:** numerical copy and caveats live outside the decorative, `aria-hidden` canvas wrapper. A 4.1% bar and text start visible. Renderer controls appear only after successful rendering. Failed WebGL initialization leaves the fallback; context loss restores it, including the 41-of-1,000 estimate label.
- **Render lifecycle:** Three.js loads near the graphic through `IntersectionObserver`. Drawing is requested after changes rather than in an autoplay loop, pauses offscreen or while the document is hidden, and disposes resources when leaving the page. There is no camera tween or perpetual motion, so the scene does not depend on motion to communicate.

### Asset provenance and bundle recipe

The custom scene and data helpers are original local code in `public/assets/death-row.js` and `public/assets/death-row-model.js`. The entry-owned vendored renderer is Three.js **0.186.1**, pinned in `package.json` and the lockfile. It comes from the installed upstream npm package `three`; `public/assets/three/LICENSE.txt` preserves its MIT license and the three.js authors' 2010–2026 copyright notice. It is software, not a sourced image/model asset.

The build agent reported producing the vendored ESM bundle with **esbuild 0.25.12** using this exact command, after installing the repository's locked dependencies:

```sh
npx --yes esbuild@0.25.12 node_modules/three/build/three.module.js --bundle --minify --format=esm --legal-comments=inline --outfile=public/assets/three/three.module.js
cp node_modules/three/LICENSE public/assets/three/LICENSE.txt
```

The MIT header is retained inline and the full license is kept beside the bundle. Runtime assets remain owned by this private entry and follow the selected-entry build boundary; placing them in `public/` does not authorize public inclusion. No new raster provenance is required because this treatment uses authored geometry and existing bundled type.

## Do's and Don'ts

- **Do** preserve the number, measurement period and estimate qualification beside the finding; keep the cell illustration's caveat attached.
- **Do** preserve all 1,000 positions and the deterministic highlight order when changing the selected interval value.
- **Do** retain native controls, readable fallback and ordinary scrolling; use immediate user-controlled view changes.
- **Don't** treat highlighted cells as identified innocent people, unlit cells as proven guilty people, or the overview as an actual facility.
- **Don't** describe the study as a current death-row estimate or a count of executions, or treat its multiple links as independent studies.
- **Don't** promote this surface's somber scene, fixed palette, geometry or local controls into global design rules.

Evidence checked: `PRODUCT.md`, the brief, content-system and daily-workflow documents, the scoped contract, `public/styles.css`, the exhibit fragment, its CSS/runtime/model helpers, dependency pin and vendored license. The build thread supplied the finish reviewer's `ship` disposition for 1440px and 390px close/overview captures plus the 821px capture; that disposition is design review only. This documenter pass made no implementation edits and ran no browser or factual verification.

Pre-existing gap/drift not canonized or repaired: root `DESIGN.md` was absent before this extension. The scoped orange and graphic also use fixed palette literals while the inherited evidence ground follows the theme; that is recorded as local implementation, not a global theme policy. Global files remain untouched because no durable system change was authorized.

## October 6 polish pass

Preserved the scene, research copy and manual interactions. Refined count spacing and label wrapping, shortened excess mobile scene space, aligned control groups and gave the range input a 44px touch area. Hover/focus/selection stay within the local warm palette. Overview framing now includes the projected population width at each permitted camera angle. Range value text describes rotation relative to its starting view. Removed superseded height rules and an unused geometry parameter.

Browser verification covered 390px, 872px and 1440px, both scene modes, all three rates, keyboard range endpoints, expanded evidence and mobile dark appearance. No overflow was observed at 390/872px and captured console warnings/errors were empty. The polish pass uses its own bounded inspection; the earlier independent ship verdict describes the pre-polish implementation.
