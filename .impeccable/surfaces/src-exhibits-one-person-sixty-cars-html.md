---
version: 1
slug: "src-exhibits-one-person-sixty-cars-html"
primary_target: "src/exhibits/one-person-sixty-cars.html"
related_targets: ["public/assets/transport.css","public/assets/transport.js","public/assets/transport-physics.js","public/assets/transport-neighborhood.js","public/assets/trader-joes-logo.svg"]
---

# Transportation Deep Dive

Local extension of the existing collection. Mode: Read with an interactive opening. Code-led; preserve orange, Outfit and ordinary continuous scrolling. The user requested a new Deep Dive type about single-occupancy cars, inspired by Bill Nye. Interactive essay is the stated working assumption after an unanswered optional confirmation; no editorial approval implied.

## Direction contract

THESIS: The vehicle is not the passenger. Keep 60 people fixed while the number of vehicles changes, then separate street capacity, fuel conversion, kinetic energy and material use.

OWN-WORLD: Inherit orange and brown, warm paper, bundled Outfit, open compositions, native disclosures and understated controls. No global redesign.

STORY: See 60 solo cars; share the ride; read about street capacity, fuel-energy losses, mass and speed; inspect assumptions and primary sources.

FIRST VIEWPORT: Oversized “One person. An entire car.” on the left, a square four-way intersection on the right. Occupancy and traffic controls precede the graphic. Deep Dive identification sits below the heading. The collection adds a “Read the Deep Dive” link; individual and exact review pages show the chapter links. Mobile stacks the copy and figure while preserving the same square junction; no road rotation.

FORM: A bespoke discovery with a collection opening that links to the full interactive essay and its evidence disclosures. Signature interaction regroups the same 60 dots into 60, 30, 15 cars or one illustrative bus. Diagram is explicitly not road-area scale. This is a local extension, exempt from concept tournament; no seed key or approved comp. No raster required.

FINISH: finish review and documentation apply to the affected surface. This ordinary extension preserves the pre-existing absence of DESIGN.md and existing global design sidecars; document local decisions only. No global visual-world change, editorial approval or release is implied.

## User steering
Nate emphasized immense personal passion and invited bold, creative execution. Commit to the car-to-people transformation, stark energy field and the closing argument for freedom to leave a car at home. Preserve evidence qualifications and avoid blaming people without alternatives.

Nate additionally requested showing the bus among single drivers. Added a separate “Bus in traffic” state: a four-way intersection, 32 solo drivers and 60 bus passengers, with the additional bus operator excluded from the labeled traveler count. It explicitly changes the population to 92, with labels and live announcement; original fixed-60 comparison remains available.

## Neighborhood ending — user-directed expansion

Nate requested that the ending focus on dense communities and improved public transit, with a stunning graphic. Replace the previous closing essay with a large original Three.js architectural model: mid-rise homes over shops, a dedicated transit corridor, protected cycling, planted sidewalks and crossings. Warm orange/brown publication framing with a sunlit architectural palette inside the scene. Three camera views reveal the whole neighborhood, the transit street and homes over shops. User-driven camera moves settle; no autoplay. This is an illustrative design proposal, not a real place, scaled density comparison, travel-time simulation or quantified environmental result. EPA smart-growth/transportation guidance supplies the supporting qualitative relationship. This new graphic and affected ending reset the bounded inspection scope; no redesign of prior chapters.

## Current storefront treatment

Use the authentic Trader Joe’s SVG from the official store-location site, as requested by Nate. The subtle cream fascia is 6 × 1.5 scene units with generous logo inset and a warm-stone surround; no red border or projecting duplicate. Keep the neighborhood as the focal point. Asset provenance remains in the private editorial record, and visible copy identifies an illustrative shop without suggesting an actual location or endorsement.

The latest correction prevents the facade awnings from piercing the sign. The backing is centered 0.55 units forward of the facade, with depth 0.7 (front face at +0.9); the logo plane is at +0.91, beyond the awnings’ +0.825 extent. Preserve this geometry when adjusting the sign or facade. The current desktop homes view shows a continuous logo face with the surrounding awnings remaining behind it.

Local implementation evidence and responsive conventions are recorded in `docs/design/transport-deep-dive.md`. Storefront review is bounded to this correction; the subsequently requested fuel-energy chapter refinement has its own implementation and review scope.

## Energy chapter refinement

Nate rejected the heat-focused heading and square-grid graphic. Replace them with “So much energy. So little motion.” and a proportionate energy-flow diagram. A cream input band branches into orange energy reaching the wheels and a wider warm-brown remainder. It explicitly depicts the 25% upper endpoint of the cited 18–25% range, with the remaining 75% labeled losses and other uses, primarily engine heat. The input and terminal output band thicknesses are 160 input, 40 to wheels and 120 remainder; curves connect them without introducing additional categories. Desktop labels flank the diagram; mobile places the input above and the two outcomes below. Preserve the full range, combined-cycle scope, EV qualification and occupancy discussion.

Implementation evidence: the source SVG, responsive styles, desktop energy capture and mobile detail capture show the implemented flow. The remainder is derived as `100 − 25 = 75`, rather than a new measured category. The graphic preserves the inherited orange/brown/cream palette with a local warm-brown remainder. Its static finish review returned ship. The motion review’s page-restoration finding was resolved and its scoped correction returned ship. No approval or release is inferred.


Latest user steering explicitly requests animation. Motion thesis: a steady current of light travels along four equal flow lines, one toward the wheels and three toward losses and other uses, explaining direction and the pictured 25/75 division. Preserve the stationary bands and labels. Use one CSS dash-offset loop, active only while the figure is visible; stop offscreen, in hidden tabs, under reduced motion or the existing site motion-off control. No new dependency or additional animation.

The implemented streams share a 2.4-second linear dash-offset loop over −92 SVG units. Intersection and document-visibility checks gate playback; system reduced motion and the site motion-off setting also hide the streams. Stationary data bands, labels and qualifications remain complete without JavaScript. Persisted pagehide pauses motion while preserving listeners and the observer; pageshow updates playback. Explicit persisted hide/show event checks passed. Actual back/forward-cache restoration was not exercised: the local away/back check loaded a new page.


## Traffic opening refinement

The current opening uses a four-way signalized intersection with 15 solo cars on each approach, two incoming lanes per approach, crosswalks and stop lines. Vehicle roof cutaways reveal all 60 travelers. Shared occupancy reduces cars to 30 or 15 on the same junction; one illustrative bus carries 60 passengers plus its operator. The separate traffic state shows 32 solo cars and 60 bus passengers, excluding the additional operator from the 92-traveler total. The bus sits mid-queue on the western approach with two cars before and two behind it in its lane. Red signals depict a waiting snapshot. The initial 60-car fallback is in HTML. Controls precede the graphic in the desktop two-column opening and mobile stack. The intersection’s scoped finish review returned ship.

## Mass, speed and harm refinement

“Heavy metal. Fragile people.” now introduces an interactive kinetic-energy and equivalent-drop demonstration. For the requested American audience, inputs are illustrative vehicle weight 2,000–8,000 lb in 500 lb steps and speed 10–60 mph. Defaults are 4,000 lb and 30 mph. The primary reading is “Like dropping this car from 30 feet. Roughly 3 stories high.” The figure retains a fixed 0–140 ft scale, with a 14-story geometric building, orange height fill and level marker. Each story represents an illustrative 10 ft; actual floor heights vary. Pounds also convert to a visible US-ton reading (lb ÷ 2,000). Foot-pounds and the energy ratio sit only inside the initially collapsed “How the comparison works” disclosure; the energy bar is removed. Detailed height remains 30.1 ft and primary height rounds to whole feet. There is no kilometer-per-hour readout. The user-triggered falling symbol follows ideal constant acceleration: energy = ½mv², equivalent height = v²/(2g), duration = v/g, with g = 9.81 m/s² internally. The model converts pounds to kilograms and results to feet and foot-pounds; display rounding leaves calculations unrounded. Mass changes energy without changing height; doubling speed quadruples both energy and height.

No autoplay, injury depiction or collision-force prediction. Changing inputs, leaving the viewport, hiding the tab, pagehide or enabling reduced motion cancels the drop. Motion-off activation announces the result without animation; static information remains available without JavaScript. Primary mechanics references, NHTSA context and model limitations remain visible. Manufacturing discussion and the separate mass-allocation table remain below or in the evidence disclosure.

The console precedes the figure in DOM order. Desktop CSS places the figure left; mobile places controls and results above it. The prior focus-order correction placed the console before the figure. The new native calculation disclosure follows the presets, before the figure’s drop button in document order. The figure’s expanded viewBox preserves the maximum-mass label. The section review’s sole material finding was this focus-order issue; the scoped correction was resolved with a ship verdict. That verdict does not assert a new whole-page review or editorial approval.

American-unit scope: controls and accessible announcements use pounds, mph, feet and foot-pounds. The separate allocation table uses 4,000 lb divided by occupants. Lane-capacity copy says about 10 feet while preserving the source’s exact 3-meter denominator. At that stage, browser data and accessible units were corrected by versioning the CSS, entry module and physics import with `?v=human-scale-polish-1`: an older cached SI module had been running against newer American-unit copy. The actual in-app browser reload now matches the current calculation and units. The fresh review of the American units and human-scale comparison returned ship across all five sections, with no material fixes. This is scoped design review, not editorial approval or release.


## Final polish

The requested polish preserves the comparison and changes its presentation: labels and values share a row, semantic range controls use filled brown rails and visible keyboard focus, and compact spacing brings the result and diagram closer on small screens. The building’s illustrative 10-foot story assumption is now printed beneath the graphic. The highlight blends orange with the current paper color. Feet and stories remain primary; calculation details stay collapsed. Singular “1 US ton” is handled correctly.

Desktop (1,440 px), phone (390 px) and the user’s panel width (646 px) were inspected, including maximum height and keyboard range endpoints. The fresh polish review returned ship with no material fixes, scoped to this section. No editorial approval or release is implied.


## Collection preview refinement

Nate requested that a Deep Dive be slightly truncated in the collection while remaining openable like other discoveries. The collection now retains the complete interactive opening, its schematic qualification and an outlined native “Read the Deep Dive” link. Individual discovery and exact review-packet pages retain the full essay, chapter navigation, sources and neighborhood script. The native link needs no JavaScript; its destination is supplied by the escaped `{{discoveryHref}}` page context.

Paired, nonnested `page:collection` and `page:discovery` comments select balanced fragments at build time. The collection DOM contains no long chapters or neighborhood script. This is a local presentation change, with no claim or physics changes. The link inherits the brown/orange palette and visible keyboard focus, with a 48 px minimum height, 28 px radius and cream-on-brown hover. At the collection-preview stage, CSS used `?v=collection-preview-1`; the entry module and physics import retained `?v=human-scale-polish-1`.

The implementation lead checked 1,440 × 1,100 desktop collection/full-page captures and a 390 × 844 mobile collection capture. Browser checks covered “Bus in traffic” (92 travelers, 32 cars and one bus), keyboard Enter and phone activation of the link, chapter navigation, return to the collection and no 390 px horizontal overflow. The collection has zero `.trip-chapter` elements; the full page retains four plus its separate energy section. The fresh scoped finish review returned ship across all five sections with no material fixes. This bounded refinement was judged against the incumbent surface, without a separate QUALITY BAR. No global system change, editorial approval or release is implied.


## Bolder crossroads opening

Nate requested an Impeccable bold/polish pass because the crossroads is the main graphic. The implemented opening uses the established ink brown for pavement, a warmer median, clearer stop bars and outbound arrows, and quieter roof-plan geometry. Empty seats and body details distinguish vehicle space from pale traveler dots: car dots have a 2.7 SVG-unit radius, bus passengers 1.9. The bus uses the existing signature orange. Copy, calculations, fonts, control radii and the collection/full-essay split are unchanged.

Count typography scales from 34–48 px on desktop and 29–38 px below 800 px; the pre-existing override at 600 px and below keeps counts at 25 px so the longest traffic label fits. CSS and the entry module now use `?v=intersection-bold-1`; the physics import remains `?v=human-scale-polish-1`. The four desktop/mobile opening and traffic captures were inspected against the source. A fresh independent reviewer returned ship across all five sections with no material fixes. Browser checks retained all occupancy modes, correct totals, no 390 px overflow and no errors. This is scoped visual review, not editorial approval or release.


## Centering correction — October 6

The closing prose, source disclosure and return link now share a centered column with a 730 px maximum width. The energy caption is centered beneath its diagram. Existing paired layouts retain left-aligned text inside centered containers. These are local template refinements; claims, illustration assets and approved release identity are unchanged.

Playwright inspected every chapter on desktop and phone and measured the main containers at 390, 800, 1,024, 1,440 and 1,760 px: zero centering offset and zero horizontal overflow. The open source disclosure also fits its column. Evidence lives under `output/playwright/transport-centering/`. Content checks and public/review builds passed. The fresh scoped finish review returned **ship**, with no material fixes. The documentation helper reached its session limit; the lead completed this bounded update from the fallback role. No global design drift was repaired or canonized.


## Share preview — October 6

The local 1,200 × 630 share card replaces the generic question mark with an original static adaptation of the article’s intersection: an orange bus among solo motorists. It preserves the approved “One person. An entire car.” headline, orange field and bundled Outfit Bold, with “Read the Deep Dive,” a drawn arrow and the visible “Illustrative traffic” qualification. The transport-only image URL is `share/one-person-sixty-cars-intersection-v1.png`; the previous URL remains an identical-byte alias, and other cards retain their treatment. Source in `scripts/share-images.mjs` and `scripts/share-transport.mjs` agrees with the full and half-size captures under `output/playwright/transport-share/`. The fresh reviewer returned ship across all five sections, with no material fixes; the review ceiling is reached. The lead verified matching Open Graph/Twitter image URLs and a local HTTP 200 PNG at the expected dimensions, and reports passing content checks, all 123 tests and public/review builds, including the alias integration check. Nate approved the displayed card and authorized release with “ship it” on October 6, 2026. No global design files or drift were changed.
